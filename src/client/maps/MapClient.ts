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
}

export { MapClient as default };