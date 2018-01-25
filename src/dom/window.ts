import * as Rx from 'rxjs';

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

export const load$ = readyState$;
export const keyDown$ = Rx.Observable.fromEvent<KeyboardEvent>(window, 'keydown');
export const keyUp$ = Rx.Observable.fromEvent<KeyboardEvent>(window, 'keyup');
