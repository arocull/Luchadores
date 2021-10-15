import MapClient from './MapClient';
import { MapSandy } from '../../common/engine/maps';
import AssetPreloader from '../AssetPreloader';
import { Particle } from '../particles';

class MapClientSandy extends MapSandy implements MapClient {
  public texture: HTMLImageElement;

  constructor() {
    super();
    AssetPreloader.getImage('Maps/Arena.jpg').then((img) => {
      this.texture = img;
    });
  }

  public get backgroundColor(): string {
    return '#e3a324';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public tickWeather(deltaTime: number, particles: Particle[]): void { }
}

export { MapClientSandy as default };