import * as Rx from 'rxjs';

import { IPoint } from './point';

export const move = (
  sprite$: Rx.Observable<Phaser.Sprite>,
  position$: Rx.Observable<IPoint>,
): Rx.Observable<void> => sprite$
  .switchMap(sprite => position$.map(position => ({sprite, position})))
  .do(({sprite, position}) => {
    sprite.body.position.x = position.x;
    sprite.body.position.y = position.y;
  })
  .map(_ => void 0)
;
