import * as Rx from 'rxjs';

import { IPoint } from '../physics/point';

export interface IGamepadStick {
  deadzone: number;
}

export interface IGamepadOptions {
  sticks: IGamepadStick[];
}

export interface IGamepad {
  sticks: Rx.Observable<IPoint>[];
}

const initializeGamepad$ = Rx.Observable
  .defer(() => {
    requestAnimationFrame(updateGamepad);
  })
;

const gamepadSubject$ = new Rx.Subject<Gamepad>();

const updateGamepad = () => {
  const gamepad = navigator.getGamepads()[0];

  if (gamepad) {
    gamepadSubject$.next(gamepad);
  }

  requestAnimationFrame(updateGamepad);
};

initializeGamepad$.subscribe(gamepadSubject$);

const gamepad$ = gamepadSubject$
  .asObservable()
;

const gamepadToStickPoint = (gamepad: Gamepad, stickIndex: number): IPoint => ({
  x: gamepad.axes[stickIndex * 2],
  y: gamepad.axes[stickIndex * 2 + 1],
});

const isNotInDeadzone = (deadzone: number, point: IPoint) =>
  Math.abs(point.x) + Math.abs(point.y) > deadzone
;

export const gamepad = (
  gamepadOptions$: Rx.Observable<IGamepadOptions>
): Rx.Observable<IGamepad> => gamepadOptions$
  .map(
    gamepadOptions => ({
      sticks: gamepadOptions.sticks.map((stick, i) =>
        gamepad$.map(gamepad => {
          const point = gamepadToStickPoint(gamepad, i);

          return isNotInDeadzone(stick.deadzone, point) ?
            point :
            {x: 0, y: 0}
          ;
        })
      ),
    })
  )
;
