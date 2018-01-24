import * as Rx from 'rxjs';

export interface IGameOptions {
  gameWidth: number;
  gameHeight: number;
}

export const gameOptions$ = Rx.Observable
  .of({
    gameWidth: 640,
    gameHeight: 480,
  } as IGameOptions)
;
