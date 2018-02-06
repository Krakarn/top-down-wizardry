import * as Rx from 'rxjs';

import { IEntity } from '../entity';
import { update$ } from '../game';
import { move } from '../physics/move';
import { IPoint } from '../physics/point';
import { position } from '../physics/position';

export const slime = (
  velocity$: Rx.Observable<IPoint>,
  startingPosition: IPoint,
): Rx.Observable<IEntity> => {

  const position$ = position(velocity$, startingPosition);

  let cachedSprite: Phaser.Sprite;

  const sprite$ = update$.first()
    .map(game => {
      if (cachedSprite) {
        return cachedSprite;
      }

      const sprite = new Phaser.Sprite(
        game,
        startingPosition.x,
        startingPosition.y,
        'slime',
      );
      game.physics.enable(sprite, Phaser.Physics.ARCADE);

      sprite.animations.add('idle', [0,1,2,1], 5, true);
      sprite.animations.play('idle');

      cachedSprite = sprite;

      return sprite;
    })
  ;

  const phaserSignalToObservable = (signal: Phaser.Signal) =>
    Rx.Observable.fromEventPattern(
      handler => signal.add(handler),
      handler => signal.remove(handler),
    )
  ;

  const spriteKilled$ = sprite$
    .switchMap(sprite => phaserSignalToObservable(sprite.events.onKilled))
    .do(x => console.log('sprite killed', x))
  ;

  const move$ = move(sprite$, position$);

  const sideEffects$ = Rx.Observable
    .merge(
      move$,
    )
    .takeUntil(spriteKilled$)
  ;

  const entity$: Rx.Observable<IEntity> = sprite$
    .switchMap(sprite => Rx.Observable.of({sprite, sideEffects$}))
  ;

  return entity$;
};
