import * as Rx from 'rxjs';

export interface IEntity {
  sprite: Phaser.Sprite;
  sideEffects$: Rx.Observable<void>;
}
