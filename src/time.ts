import * as Rx from 'rxjs';

import { update$ } from './game';

export const t$ = update$
  .timestamp()
  .map(({timestamp}) => timestamp)
  .share()
;

export const dt$ = t$
  .bufferCount(2, 1)
  .map(([oldTime, newTime]) => (newTime - oldTime) / 1000)
  .share()
;

export const accumulateDt = (time: number) =>
  dt$
  .scan((t, dt) => t + dt, 0)
  .first(t => t >= time)
;
