import * as Rx from 'rxjs';

import { slime } from './creatures/slime';
import { IEntity } from './entity';
import { update$ } from './game';

const slimes$ = Rx.Observable
  .interval(500)
  .mergeMap(x => slime(
    Rx.Observable.of({x: 0, y: 0}),
    {x: Math.random() * 600, y: Math.random() * 450},
  ))
;

export const enemies$: Rx.Observable<IEntity> = slimes$;

export const enemyGroup$ = update$.first()
  .map(game => game.add.group())
  .publishReplay(1)
;

enemyGroup$.connect();

export const updateEnemyGroup$ = enemyGroup$
  .switchMap(group =>
    enemies$.do(enemy => {
      group.add(enemy.sprite);
    })
  )
;
