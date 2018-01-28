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

  const spriteKilled$ = new Rx.Subject<Phaser.Sprite>();

  const sprite$ = update$.first()
    .map(game => {
      const sprite = new Phaser.Sprite(
        game,
        startingPosition.x,
        startingPosition.y,
        'slime',
      );
      game.physics.enable(sprite, Phaser.Physics.ARCADE);

      sprite.animations.add('idle', [0,1,2,1], 5, true);
      sprite.animations.play('idle');

      sprite.events.onKilled.add(() => {
        spriteKilled$.next(sprite);
        sprite.destroy();
      });

      return sprite;
    })
    .publishReplay(1)
  ;

  sprite$.connect();

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
