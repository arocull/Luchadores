import MapClient from './MapClient';
import { MapGrassy } from '../../common/engine/maps';
import AssetPreloader from '../AssetPreloader';
import { Particle } from '../particles';

class MapClientGrassy extends MapGrassy implements MapClient {
  public texture: HTMLImageElement;

  constructor() {
    super();
    AssetPreloader.getImage('Maps/Grass.jpg').then((img) => {
      this.texture = img;
    });
  }

  public get backgroundColor(): string {
    return '#0d542f';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public tickWeather(deltaTime: number, particles: Particle[]): void { }
}

export { MapClientGrassy as default };