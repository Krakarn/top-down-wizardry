import * as Rx from 'rxjs';

export interface IWindow {
  load$: Rx.Observable<Event | void>;
  keyDown$: Rx.Observable<KeyboardEvent>;
  keyUp$: Rx.Observable<KeyboardEvent>;
}

const readyStatePromise = new Promise<void>((resolve, reject) => {
  const timeout = 50;

  const checkReadyState = () => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      setTimeout(checkReadyState, timeout);
    }
  };

  setTimeout(checkReadyState, timeout);
});

const readyState$ = Rx.Observable.fromPromise(readyStatePromise);

const load$ = readyState$;

export const _window: IWindow = {
  load$,
  keyDown$: Rx.Observable.fromEvent(window, 'keydown'),
  keyUp$: Rx.Observable.fromEvent(window, 'keyup'),
};
