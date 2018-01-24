import * as Rx from 'rxjs';

import { _window } from './window';

export interface IKeyInput {
  up$: Rx.Observable<KeyboardEvent>;
  down$: Rx.Observable<KeyboardEvent>;
  state$: Rx.Observable<'up' | 'down'>;
}

export interface IInput {
  up: IKeyInput;
  down: IKeyInput;
  right: IKeyInput;
  left: IKeyInput;
  space: IKeyInput;
}

const key = (keyCode: number): IKeyInput => {
  const up$ = _window.keyUp$.filter(e => e.keyCode === keyCode);
  const down$ = _window.keyDown$.filter(e => e.keyCode === keyCode);

  const downNonRepeat$ = down$
    .throttle(e => up$.map(e => 0))
  ;

  const state$ = Rx.Observable
    .merge<'down' | 'up'>(
      downNonRepeat$.map(() => 'down'),
      up$.map(() => 'up'),
    )
    .startWith('up')
  ;

  return {
    down$: downNonRepeat$,
    up$,
    state$,
  };
};

export const input: IInput = {
  up: key(38),
  down: key(40),
  left: key(37),
  right: key(39),
  space: key(32),
};
