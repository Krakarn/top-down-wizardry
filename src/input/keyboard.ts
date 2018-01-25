import * as Rx from 'rxjs';

import { keyDown$, keyUp$ } from '../dom/window';

export interface IKeyInput {
  up$: Rx.Observable<KeyboardEvent>;
  down$: Rx.Observable<KeyboardEvent>;
  state$: Rx.Observable<'up' | 'down'>;
}

export const key = (keyCode: number): IKeyInput => {
  const up$ = keyUp$.filter(e => e.keyCode === keyCode);
  const down$ = keyDown$.filter(e => e.keyCode === keyCode);

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
