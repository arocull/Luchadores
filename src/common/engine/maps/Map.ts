import Prop from '../props/Prop';
import { MapPreset } from '../Enums';

/**
 * @class
 * @name Map
 * @summary Map Class that contains data on map width, height, friction, and arena wall strength, with read-only properties
 */
class Map {
  // Declare private properties
  private mapId: MapPreset;
  private mapWidth: number;
  private mapHeight: number;
  private mapFriction: number;
  private mapWallStrength: number;

  // Map Constructor
  constructor(id: MapPreset = MapPreset.None, width: number = 40, height: number = 40, friction: number = 23, wallStrength: number = 10000) {
    this.mapId = id;
    this.mapWidth = width;
    this.mapHeight = height;
    this.mapFriction = friction;
    this.mapWallStrength = wallStrength;
  }

  public get id(): MapPreset {
    return this.mapId;
  }
  // Make read-only properties
  public get width(): number {
    return this.mapWidth;
  }
  public get height(): number {
    return this.mapHeight;
  }
  public get friction(): number {
    return this.mapFriction;
  }
  public get wallStrength(): number {
    return this.mapWallStrength;
  }

  /**
   * @function getProps
   * @returns {Prop[]} A list of props for the map to load in
   */
  public getProps(): Prop[] {
    return [];
  }
}

export { Map as default };