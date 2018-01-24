import * as Rx from 'rxjs';

import { gameOptions$, IGameOptions } from './game-options';
import { _window } from './window';

const spawnGame = (gameOptions: IGameOptions) =>
  new Phaser.Game(
    gameOptions.gameWidth,
    gameOptions.gameHeight,
    Phaser.AUTO,
    document.body,
    gameState,
  )
;

let gameInstance: Phaser.Game;

const gameInstance$ = _window
  .load$
  .withLatestFrom(gameOptions$)
  .map(([_, gameOptions]) => spawnGame(gameOptions))
  .share()
;

const game$ = Rx.Observable
  .defer(() => {
    if (gameInstance) {
      return Rx.Observable.of(gameInstance);
    } else {
      return gameInstance$.do(game => gameInstance = game);
    }
  })
;

const preloadSubject$ = new Rx.ReplaySubject<void>(1);
const preload$ = preloadSubject$
  .asObservable()
  .withLatestFrom(game$, (_, game) => game)
;
const preload = () => preloadSubject$.next(void 0);

const createSubject$ = new Rx.ReplaySubject<void>(1);
const create$ = createSubject$
  .asObservable()
  .withLatestFrom(game$, (_, game) => game)
;
const create = () => createSubject$.next(void 0);

const updateSubject$ = new Rx.Subject<void>();
const update$ = updateSubject$
  .asObservable()
  .withLatestFrom(game$, (_, game) => game)
;
const update = () => {
  updateSubject$.next();
};

const gameState = {
  preload,
  create,
  update,
};

export interface IGame {
  game$: Rx.Observable<Phaser.Game>;
  preload$: Rx.Observable<Phaser.Game>;
  create$: Rx.Observable<Phaser.Game>;
  update$: Rx.Observable<Phaser.Game>;
}

export const game: IGame = {
  game$,
  preload$,
  create$,
  update$,
};
