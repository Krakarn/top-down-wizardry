import * as Rx from 'rxjs';

import { IEntity } from './entity';
import { game$, update$ } from './game';
import { gamepad } from './input/gamepad';
import { key, keys } from './input/keyboard';
import { move } from './physics/move';
import { IPoint } from './physics/point';
import { position } from './physics/position';
import { accumulateDt, dt$ } from './time';

import { enemyGroup$ } from './enemies';

const speed = 150;

const gamepad$ = gamepad(Rx.Observable.of({
  sticks: [{ deadzone: 0.5 }, { deadzone: 0.5 }],
}));

const leftStick$ = gamepad$.switchMap(gamepad => gamepad.sticks[0]);
const rightStick$ = gamepad$.switchMap(gamepad => gamepad.sticks[1]);

const keyRight = key(keys.right);
const keyUp = key(keys.up);
const keyLeft = key(keys.left);
const keyDown = key(keys.down);

const keyD = key(keys.d);
const keyW = key(keys.w);
const keyA = key(keys.a);
const keyS = key(keys.s);

const velocityFromGamepad$: Rx.Observable<IPoint> = leftStick$
  .map(({x, y}) => ({x: x * speed, y: y * speed}))
  .distinctUntilChanged((v1, v2) => v1.x === v2.x && v1.y === v2.y)
;

const velocityXFromKeyboard$ = Rx.Observable
  .merge(
    keyD.down$.map(_ => 1),
    keyD.up$.map(_ => -1),
    keyA.down$.map(_ => -1),
    keyA.up$.map(_ => 1),
  )
  .scan((sum, vx) => sum + vx, 0)
  .map(vx => vx * speed)
;

const velocityYFromKeyboard$ = Rx.Observable
  .merge(
    keyS.down$.map(_ => 1),
    keyS.up$.map(_ => -1),
    keyW.down$.map(_ => -1),
    keyW.up$.map(_ => 1),
  )
  .scan((sum, vy) => sum + vy, 0)
  .map(vy => vy * speed)
;

const velocityFromKeyboard$: Rx.Observable<IPoint> = Rx.Observable
  .combineLatest(
    velocityXFromKeyboard$,
    velocityYFromKeyboard$,
    (x, y) => ({x, y}),
  )
  .startWith({x: 0, y: 0})
;

const velocity$: Rx.Observable<IPoint> = Rx.Observable
  .merge(
    velocityFromKeyboard$,
    velocityFromGamepad$,
  )
;

const position$: Rx.Observable<IPoint> = position(velocity$);

const spawnShot = (
  game: Phaser.Game,
  group: Phaser.Group,
  x: number,
  y: number,
  d: number,
): Rx.Observable<void> => {
  const shot = new Phaser.Sprite(game, x, y, 'arcane-ball');
  shot.anchor.setTo(0.5, 0.5);

  game.physics.enable(shot, Phaser.Physics.ARCADE);

  shot.animations.add('idle', [1,2,1,3,2,4,3]);
  shot.animations.add('explode', [4,5,6,7,8,9]);

  shot.rotation = d;
  game.physics.arcade.velocityFromRotation(shot.rotation, 150, shot.body.velocity);
  shot.animations.play('idle', 15, true);

  group.add(shot);

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

const shootPointFromGamepad$ = rightStick$;

const shootXFromKeyboard$ = Rx.Observable
  .merge(
    keyRight.down$.map(_ => 1),
    keyRight.up$.map(_ => -1),
    keyLeft.down$.map(_ => -1),
    keyLeft.up$.map(_ => 1),
  )
  .scan((sum, sx) => sum + sx, 0)
  .map(sx => sx * speed)
;

const shootYFromKeyboard$ = Rx.Observable
  .merge(
    keyDown.down$.map(_ => 1),
    keyDown.up$.map(_ => -1),
    keyUp.down$.map(_ => -1),
    keyUp.up$.map(_ => 1),
  )
  .scan((sum, sy) => sum + sy, 0)
  .map(sy => sy * speed)
;

const shootPointFromKeyboard$: Rx.Observable<IPoint> = Rx.Observable
  .combineLatest(
    shootXFromKeyboard$,
    shootYFromKeyboard$,
    (x, y) => ({x, y}),
  )
  .startWith({x: 0, y: 0})
;

const shootDirection$ = Rx.Observable
  .merge(
    shootPointFromGamepad$,
    shootPointFromKeyboard$,
  )
  .filter(({x, y}) => x !== 0 || y !== 0)
  .map(({x, y}) => Math.atan2(y, x))
;

const shotGroup$ = update$.first()
  .map(game => game.add.group())
  .publishReplay(1)
;

shotGroup$.connect();

const shootAction$ = shootDirection$
  .withLatestFrom(
    game$,
    shotGroup$,
    position$,
    (direction, game, group, position) =>
      ({game, group, direction, position}),
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
  .mergeMap(({game, group, direction, position}) =>
    spawnShot(game, group, position.x, position.y, direction)
  )
;

const sprite$ = Rx.Observable
  .combineLatest(
    update$.first(),
    position$.first(),
  )
  .map(([game, position]) => {
    const sprite = game.add.sprite(position.x, position.y, 'player');
    game.physics.enable(sprite, Phaser.Physics.ARCADE);

    sprite.animations.add('idle', [0]);
    sprite.animations.play('idle', 50, true);

    game.camera.follow(sprite);

    return sprite;
  })
  .publishReplay(1)
;

sprite$.connect();

const shotCollision$ = Rx.Observable
  .combineLatest(
    update$,
    shotGroup$,
    enemyGroup$,
  )
  .do(([game, shotGroup, enemyGroup]) => {
    game.physics.arcade.overlap(
      shotGroup,
      enemyGroup,
      (shot: Phaser.Sprite, enemy: Phaser.Sprite) => {
        enemy.kill();
        shot.kill();
      }
    );
  })
;

const move$ = move(sprite$, position$);

const sideEffects$ = Rx.Observable
  .merge(
    shoot$,
    move$,
    shotCollision$,
  )
  .map(_ => void 0)
;

export const entity$: Rx.Observable<IEntity> = sprite$
  .switchMap(sprite => Rx.Observable.of({sprite, sideEffects$}))
;
