import 'p2';
import 'pixi';
import 'phaser';

import * as Rx from 'rxjs';

import { IEntity } from './entity';
import { preload$, create$ } from './game';
import { entity$ } from './player';

const loadSpritesheet$ = preload$
  .do(game => {
    game.load.spritesheet(
      'player',
      'assets/sprites/sprites.png',
      32,32,1
    );

    game.load.spritesheet(
      'arcane-ball',
      'assets/sprites/sprites.png',
      32,32,9,0,0,1
    );

    game.load.image('tiles', 'assets/tilemaps/tiles/tiles.png');

    game.load.tilemap(
      'tilemap',
      'assets/tilemaps/maps/test.json',
      null,
      Phaser.Tilemap.TILED_JSON,
    );
  })
;

const initializeGame$ = create$
  .do(game => {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.stage.backgroundColor = '#7A6AdA';
  })
;

interface ISpace {
  stage: Phaser.Tilemap;
  entities: IEntity[];
}

const stage$ = create$
  .do(game => {
    const map = game.add.tilemap('tilemap');
    map.addTilesetImage('tileset2', 'tiles');

    const layer = map.createLayer('Tile Layer 1');
    layer.resizeWorld();
  })
;

const currentStage$ = stage$;

const currentEntities$ = Rx.Observable
  .timer(1000)
  .switchMap(_ => entity$)
  .map(player => [player])
;

const currentSpace$ = Rx.Observable
  .combineLatest(
    currentStage$,
    currentEntities$,
  )
  .map(([stage, entities]) => ({stage, entities}))
;

const currentEntitiesSideEffects$ = currentEntities$
  .switchMap(entities => Rx.Observable.from(entities.map(e => e.sideEffects$)))
  .mergeAll()
;

const sideEffects$ = Rx.Observable
  .merge(
    loadSpritesheet$,
    initializeGame$,
    currentEntitiesSideEffects$,
    currentSpace$,
  )
;

const run = () => {
  sideEffects$.subscribe(
    () => {},
    error => { console.error(error); },
    () => {},
  );
};

run();
