import * as Rx from 'rxjs';

import { IEntity } from './entity';
import { game } from './game';
import { gamepad$ } from './gamepad';
import { input } from './input';
import { IPoint } from './point';
import { dt$, accumulateDt } from './time';

export interface IPlayer {
  entity$: Rx.Observable<IEntity>;
}

const speed = 150;

const inputX$ = gamepad$
  .map(gamepad => gamepad.axes[0])
;

const inputY$ = gamepad$
  .map(gamepad => gamepad.axes[1])
;

const inputX2$ = gamepad$
  .map(gamepad => gamepad.axes[2])
;

const inputY2$ = gamepad$
  .map(gamepad => gamepad.axes[3])
;

const isNotInDeadzone = (x: number, y: number) =>
  Math.abs(x) + Math.abs(y) > 0.5
;

const velocity$: Rx.Observable<IPoint> = Rx.Observable
  .combineLatest(
    inputX$,
    inputY$,
  )
  .map(([x, y]) => {
    if (isNotInDeadzone(x, y)) {
      return {x: x * speed, y: y * speed};
    } else {
      return {x: 0, y: 0};
    }
  })
;

const position$ = dt$
  .withLatestFrom(
    velocity$,
    (dt, v) => ({v, dt})
  )
  .scan((acc, {v, dt}) =>
    ({x: acc.x + v.x * dt, y: acc.y + v.y * dt}),
    {x: 0, y: 0},
  )
  .bufferCount(2, 1)
  .filter(([op, np]) => op.x !== np.x || op.y !== np.y)
  .map(([op, np]) => np)
  .startWith({x: 0, y: 0})
;

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

const shootDirection$ = Rx.Observable
  .combineLatest(
    inputX2$,
    inputY2$,
  )
  .filter(([x, y]) => isNotInDeadzone(x, y))
  .map(([x, y]) => Math.atan2(y, x))
;

const shootAction$ = shootDirection$
  .withLatestFrom(
    game.game$,
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
    game.game$,
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

const move$ = playerSprite$
  .switchMap(sprite => position$.map(position => ({sprite, position})))
  .do(
    ({sprite, position}) => {
      sprite.body.position.x = position.x;
      sprite.body.position.y = position.y;
    }
  )
;

const player$ = Rx.Observable
  .merge(
    shoot$,
    move$,
  )
  .map(_ => void 0)
;

const entity$ = Rx.Observable
  .of({
    sideEffects$: player$,
  } as IEntity)
;

export const player: IPlayer = {
  entity$,
};
