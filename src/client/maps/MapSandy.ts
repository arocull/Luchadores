import MapClient from './MapClient';
import { MapSandy } from '../../common/engine/maps';
import AssetPreloader from '../AssetPreloader';
import { Particle, PLandingDust } from '../particles';
import Vector from '../../common/engine/Vector';

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

  public landParticles(landVelocity: number, landMass: number, position: Vector, particles: Particle[]): void {
    PLandingDust.Burst(particles, position, landMass, landVelocity);
  }
}

export { MapClientSandy as default };