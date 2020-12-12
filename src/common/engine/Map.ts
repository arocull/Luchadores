import Prop from './props/Prop';
import { Vector } from './math';
import { MapPreset, ColliderType } from './Enums';
import { MessageBus } from '../messaging/bus';

class Map {
  public Texture: HTMLImageElement;

  // Width and height are respective boundaries of arena
  // Friction is how much the arena floor effects and slows down fighters
  // Texture Source is the source file of the map texture--ignored if set to an empty string
  // Wall Strength is the acceleration applied to fighters when outside the arena multiplied by how far out they are
  constructor(
    public Width: number,
    public Height: number,
    public Friction: number,
    public wallStrength: number = 50,
    public mapID: MapPreset = MapPreset.Sandy,
  ) {
    this.Texture = null;
  }

  public loadTexture(mapID: MapPreset = this.mapID, customTexture: string = '') {
    let textureSrc;

    if (customTexture !== '') {
      textureSrc = customTexture;
    } else {
      switch (mapID) {
        case MapPreset.Grassy: textureSrc = 'Maps/Grass.jpg'; break;
        case MapPreset.Snowy: textureSrc = 'Maps/Snowy.jpg'; break;
        case MapPreset.Sandy:
        default: textureSrc = 'Maps/Arena.jpg';
      }
    }

    if (textureSrc) {
      MessageBus.publish('LoadAsset_Map', { map: this, texture: textureSrc });
    }
  }

  public getProps(mapID: MapPreset = this.mapID, loadTextures: boolean = false): Prop[] {
    if (mapID === MapPreset.Sandy) {
      const props = [
        new Prop(new Vector(10, 30, 0), ColliderType.Cylinder, 0.4, 1),
        new Prop(new Vector(10.4, 30.5, 0), ColliderType.Cylinder, 0.4, 1),
        new Prop(new Vector(11.3, 30.4, 0), ColliderType.Cylinder, 0.4, 1),
        new Prop(new Vector(22, 34, 0), ColliderType.Cylinder, 0.4, 1),
        new Prop(new Vector(11, 10, 0), ColliderType.Cylinder, 0.4, 1),
        new Prop(new Vector(10.2, 10.3, 0), ColliderType.Cylinder, 0.4, 1),
        // Barrel Stack
        new Prop(new Vector(34.7, 15.3, 0), ColliderType.Cylinder, 0.4, 1),
        new Prop(new Vector(35.3, 15.3, 0), ColliderType.Cylinder, 0.4, 1),
        new Prop(new Vector(35, 14.7, 0), ColliderType.Cylinder, 0.4, 1),
        new Prop(new Vector(35, 14.9, 1), ColliderType.Cylinder, 0.35, 1),
      ];
      if (loadTextures) {
        for (let i = 0; i < props.length; i++) {
          props[i].SetTexture('Sprites/Barrel.png', 1.1);
        }
      }
      return props;
    }

    return [];
  }
}

export { Map as default };
