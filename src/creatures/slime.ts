import * as Rx from 'rxjs';

import { IEntity } from '../entity';
import { game$ } from '../game';
import { move } from '../physics/move';
import { IPoint } from '../physics/point';
import { position } from '../physics/position';

const velocity$ = Rx.Observable.of({x: 5, y: 5} as IPoint);

const position$ = position(velocity$);

const sprite$: Rx.Observable<Phaser.Sprite> = Rx.Observable
  .combineLatest(
    game$,
    position$.first(),
  )
  .map(([game, position]) => {
    const sprite = game.add.sprite(position.x, position.y, 'slime');
    game.physics.enable(sprite, Phaser.Physics.ARCADE);

    sprite.animations.add('idle', [0,1,2,1], 5, true);
    sprite.animations.play('idle');

    return sprite;
  })
;

const move$ = move(sprite$, position$);

const sideEffects$ = Rx.Observable
  .merge(
    move$,
  )
;

export let entity$: Rx.Observable<IEntity> = sprite$
  .switchMap(sprite => Rx.Observable.of({sprite, sideEffects$}))
;
