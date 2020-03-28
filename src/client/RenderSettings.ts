// Render settings for client -- can be raised or lowered to help client
class RenderSettings {
  // Quality is general quality of rendering--if this is lowered, we can reduce extra things that are cool but take processing power
  // --such as arena wall stretching or depth sorting--value should range between 0 and 3

  // Particle amount is actively used to tell how many particles to spawn--value should range between 0 and 5
  constructor(public Quality: number, public ParticleAmount: number, public EnableCameraShake: boolean) {

  }
}

export { RenderSettings as default };