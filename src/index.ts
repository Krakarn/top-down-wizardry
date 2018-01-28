import 'p2';
import 'pixi';

import 'phaser';

import * as Rx from 'rxjs';

import { enemies$, updateEnemyGroup$ } from './enemies';
import { IEntity } from './entity';
import { create$, game$, preload$, update$ } from './game';
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

const stage$ = create$
  .do(game => {
    const map = game.add.tilemap('tilemap');
    map.addTilesetImage('tileset2', 'tiles');

    const layer = map.createLayer('Tile Layer 1');
    layer.resizeWorld();
  })
;

const currentStage$ = stage$;

// enemy.sideEffects$ in the mergeMap
// seems to not be reduced in number of observables
// even though they are completed (I think)
// needs further investigation as to avoid memory leak here
const entitiesSideEffects$ = update$.first()
  .switchMap(_ =>
    Rx.Observable.merge(
      player$.switchMap(player => player.sideEffects$),
      enemies$.mergeMap(enemy => enemy.sideEffects$),
    )
  )
;

const sideEffects$ = Rx.Observable
  .merge(
    loadSpritesheet$,
    initializeGame$,
    entitiesSideEffects$,
    currentStage$,
    updateEnemyGroup$,
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
