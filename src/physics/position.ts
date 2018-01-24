import * as Rx from 'rxjs';

import { IPoint } from './point';
import { dt$ } from '../time';

export const position = (
  velocity$: Rx.Observable<IPoint>,
): Rx.Observable<IPoint> => dt$
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
