import * as Rx from 'rxjs';

const gamepadSubject$ = new Rx.Subject<Gamepad>();

export const gamepad$ = Rx.Observable
  .defer(() => {
    requestAnimationFrame(updateGamepad);

    return gamepadSubject$
      .asObservable()
    ;
  })
;

const updateGamepad = () => {
  const gamepad = navigator.getGamepads()[0];

  if (gamepad) {
    gamepadSubject$.next(gamepad);
  }

  requestAnimationFrame(updateGamepad);
};
