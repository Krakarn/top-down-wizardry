import * as Rx from 'rxjs';

import { dt$ } from '../time';
import { IPoint } from './point';

export const position = (
  velocity$: Rx.Observable<IPoint>,
  startingPoint: IPoint = {x: 0, y: 0},
): Rx.Observable<IPoint> => dt$
  .withLatestFrom(
    velocity$,
    (dt, v) => ({v, dt})
  )
  .scan((acc, {v, dt}) =>
    ({x: acc.x + v.x * dt, y: acc.y + v.y * dt}),
    {...startingPoint},
  )
  .startWith({...startingPoint})
  .distinctUntilChanged(
    (p1, p2) => p1.x === p2.x && p1.y === p2.y
  )
;
