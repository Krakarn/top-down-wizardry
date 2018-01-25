import 'p2';
import 'pixi';

import 'phaser';

import * as Rx from 'rxjs';

import { entity$ as slime$ } from './creatures/slime';
import { IEntity } from './entity';
import { create$, preload$ } from './game';
import { entity$ as player$ } from './player';

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

    game.load.spritesheet(
      'slime',
      'assets/sprites/slime.png',
      32,32,3
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
  .combineLatest(player$, slime$)
;

const currentSpace$ = Rx.Observable
  .combineLatest(
    currentStage$,
    currentEntities$,
  )
  .map(([stage, entities]) => ({stage, entities}))
;

const currentEntitiesSideEffecst$ = currentEntities$
  .switchMap(entities => Rx.Observable.from(entities.map(e => e.sideEffects$)))
  .delay(1000)
  .mergeAll()
;

const sideEffects$ = Rx.Observable
  .merge(
    loadSpritesheet$,
    initializeGame$,
    currentEntitiesSideEffecst$,
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
