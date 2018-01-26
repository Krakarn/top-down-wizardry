import * as Rx from 'rxjs';

import { IEntity } from './entity';
import { create$, game$ } from './game';
import { gamepad } from './input/gamepad';
import { move } from './physics/move';
import { IPoint } from './physics/point';
import { position } from './physics/position';
import { accumulateDt, dt$ } from './time';

const speed = 150;

const gamepad$ = gamepad(Rx.Observable.of({
  sticks: [{ deadzone: 0.5 }, { deadzone: 0.5 }],
}));

const leftStick$ = gamepad$.switchMap(gamepad => gamepad.sticks[0]);
const rightStick$ = gamepad$.switchMap(gamepad => gamepad.sticks[1]);

const velocity$: Rx.Observable<IPoint> = leftStick$
  .map(({x, y}) => ({x: x * speed, y: y * speed}))
;

const position$: Rx.Observable<IPoint> = position(velocity$);

const spawnShot = (
  game: Phaser.Game,
  x: number,
  y: number,
  d: number
): Rx.Observable<void> => {
  const shot = game.add.sprite(x, y, 'arcane-ball');
  shot.anchor.setTo(0.5, 0.5);

  game.physics.enable(shot, Phaser.Physics.ARCADE);

  shot.animations.add('idle', [1,2,1,3,2,4,3]);
  shot.animations.add('explode', [4,5,6,7,8,9]);

  shot.rotation = d;
  game.physics.arcade.velocityFromRotation(shot.rotation, 150, shot.body.velocity);
  shot.animations.play('idle', 15, true);

  return accumulateDt(3)
    .do(() => {
      shot.body.velocity.x = 0;
      shot.body.velocity.y = 0;
      shot.animations.play('explode', 25, false);
    })
    .switchMap(() => accumulateDt(0.24))
    .do(() => {
      shot.destroy();
    })
    .map(_ => void 0)
    .share()
  ;
};

const shootDirection$ = rightStick$
  .filter(({x, y}) => x !== 0 && y !== 0)
  .map(({x, y}) => Math.atan2(y, x))
;

const shootAction$ = shootDirection$
  .withLatestFrom(
    game$,
    position$,
    (direction, game, position) => ({game, direction, position}),
  )
;

const shootCooldown$ = shootAction$
  .exhaustMap(() => accumulateDt(0.1))
;

const shoot$ = shootCooldown$
  .withLatestFrom(
    shootAction$,
    (_, shootAction) => shootAction,
  )
  .mergeMap(({game, direction, position}) =>
    spawnShot(game, position.x, position.y, direction)
  )
;

const playerSprite$ = Rx.Observable
  .combineLatest(
    create$,
    position$.first(),
  )
  .map(([game, position]) => {
    const playerSprite = game.add.sprite(position.x, position.y, 'player');
    game.physics.enable(playerSprite, Phaser.Physics.ARCADE);

    playerSprite.animations.add('idle', [0]);
    playerSprite.animations.play('idle', 50, true);

    game.camera.follow(playerSprite);

    return playerSprite;
  })
;

const move$ = move(playerSprite$, position$);

const sideEffects$ = Rx.Observable
  .merge(
    shoot$,
    move$,
  )
  .map(_ => void 0)
;

export const entity$ = Rx.Observable
  .of({sideEffects$} as IEntity)
;
