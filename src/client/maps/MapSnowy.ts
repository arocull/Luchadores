import MapClient from './MapClient';
import { MapSnowy } from '../../common/engine/maps';
import AssetPreloader from '../AssetPreloader';
import Vector from '../../common/engine/Vector';
import { Particle, PLandingSnow, PSnowfall } from '../particles';

class MapClientSnowy extends MapSnowy implements MapClient {
  public texture: HTMLImageElement;

  // Weather specific
  private particleTimer: number = 0;
  private topLeft: Vector;
  private bottomRight: Vector;

  constructor() {
    super();

    // Set bounding box for weather
    this.topLeft = new Vector(-10, -10, 10);
    this.bottomRight = new Vector(this.width + 10, this.height + 10, 12);

    AssetPreloader.getImage('Maps/Snowy.jpg').then((img) => {
      this.texture = img;
    });
  }

  public get backgroundColor(): string {
    return '#eefcfc';
  }

  public tickWeather(deltaTime: number, particles: Particle[]): void {
    this.particleTimer += 200 * deltaTime; // Spawn around 200 particles per second
    PSnowfall.Spawn(particles, this.topLeft, this.bottomRight, Math.floor(this.particleTimer), 1); // Spawn integer amount

    this.particleTimer -= Math.floor(this.particleTimer); // Subtract out number of particles spawned
  }

  public landParticles(landVelocity: number, landMass: number, position: Vector, particles: Particle[]): void {
    PLandingSnow.Burst(particles, position, landMass, landVelocity);
  }
}

export { MapClientSnowy as default };