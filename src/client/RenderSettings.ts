import { RenderQuality } from '../common/engine/Enums';

// Render settings for client -- can be raised or lowered to help client
class RenderSettingsBase {
  // Quality is general quality of rendering--if this is lowered, we can reduce extra things that are cool but take processing power
  // --such as arena wall stretching or depth sorting--value should range between 0 and 3

  private particles: number;
  public FPScounter: boolean;

  // Particle amount is actively used to tell how many particles to spawn--value should range between 0 and 5
  constructor(public Quality: RenderQuality, public ParticleAmount: number, public EnableCameraShake: boolean, public EnableAnnouncer: boolean = true) {
    this.particles = 0;
    this.FPScounter = false;
  }

  /**
   * @function nextParticle
   * @summary Returns true if the next particle should be spawned, false otherwise
   * @description Iterates a counter that is compared against the player's render settings.
   * If the modulus of the counter is less than or equal to the particle amount setting, this function returns true.
   * @returns {boolean} If true, spawn the given particle
   */
  public nextParticle(): boolean {
    this.particles++;

    return (this.particles % 5) <= this.ParticleAmount;
  }

  /**
   * @function getParticleRatio
   * @summary Returns the percentage of all particles that should actually be spawned
   * @returns {number} Percentage of particles that should spawn
   */
  public getParticleRatio(): number {
    return this.ParticleAmount / 5;
  }
}

// Render settings are global across client
const RenderSettings = new RenderSettingsBase(3, 5, true);
export { RenderSettings as default };