import { RenderQuality } from '../common/engine/Enums';

// Render settings for client -- can be raised or lowered to help client
class RenderSettingsBase {
  // Quality is general quality of rendering--if this is lowered, we can reduce extra things that are cool but take processing power
  // --such as arena wall stretching or depth sorting--value should range between 0 and 3

  private particles: number;
  public FPScounter: boolean;

  // Particle amount is actively used to tell how many particles to spawn--value should range between 0 and 5
  constructor(public Quality: RenderQuality, public ParticleAmount: number, public EnableCameraShake: boolean, public EnableAnnouncer: boolean = false) {
    this.particles = 0;
    this.FPScounter = false;
  }

  public nextParticle(): boolean {
    this.particles++;

    return (this.particles % 5) <= this.ParticleAmount;
  }
}

// Render settings are global across client
const RenderSettings = new RenderSettingsBase(3, 5, true);
export { RenderSettings as default };