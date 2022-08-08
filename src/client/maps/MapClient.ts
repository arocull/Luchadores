import Vector from '../../common/engine/Vector';
import { Particle } from '../particles/index';

/**
 * @interface MapClient
 * @summary Implements render features for maps
 */
interface MapClient {
  texture: HTMLImageElement;
  backgroundColor: string;

  /**
   * @function tickWeather
   * @summary Performs map-specific weather effects
   * @param {number} deltaTime Change in time since last frame, in seconds
   * @param {Particle[]} particles Array of particles to spawn new particles into
   */
  tickWeather(deltaTime: number, particles: Particle[]): void;

  /**
   * @function landParticles
   * @summary Spawns particles for landing effects, i.e. dust, dirt, or snow
   * @param {number} landVelocity Landing velocity of move
   * @param {Vector} position Position to spawn the particles at
   * @param {Particle[]} particles Array of particles to spawn new particles into
   */
  landParticles(landVelocity: number, landMass: number, position: Vector, particles: Particle[]): void;
}

export { MapClient as default };