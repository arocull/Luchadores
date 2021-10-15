import Vector from '../../common/engine/Vector';
import Particle from './Particle';
import { ParticleType } from '../../common/engine/Enums';
import RenderSettings from '../RenderSettings';

class PSnowfall extends Particle {
  private wind: Vector; // Velocity of wind (used for acceleration)
  private blowRate: number; // How often the wind blows on this snowflake

  constructor(position: Vector, windVelocity: Vector, size: number = 0.05, lifetime: number = 5) {
    super(
      ParticleType.Snowfall,
      lifetime * ((Math.random() / 2.5) + 0.8), // Lifetime ranges between 0.8 and 1.2
      Particle.RGBToHex(244, 245 + Math.random() * 3, 249 + Math.random() * 6), // Chose bluish-white color
      position, position,
    );

    this.wind = windVelocity;
    this.blowRate = 0.7 + Math.random() * 5.3;

    this.Width = size * ((Math.random() / 5) + 0.9); // Width ranges between 0.9 and 1.1
    this.UsePhysics = true;
    this.Drag = 0.12;
    this.BounceReturn = 0;
    this.StopOnGround = true;
    this.Velocity = Vector.Multiply(windVelocity, (Math.random() / 5) + 0.9); // Velocity ranges between 0.9 and 1.1
    this.Velocity.z = 0; // Zero out z-velocity initially
  }

  protected UpdateAlpha() {
    const percent = this.Lifetime / this.MaxLifetime;
    this.Alpha = 1 - ((2 * percent - 1) ** 10); // Steeply raise/drop opacity off near start/end of lifteime
    this.Acceleration = Vector.Multiply(this.wind, (-Math.cos(Math.PI * percent * this.blowRate) + 1)); // Wind billows in and out
    this.Acceleration.z -= 1; // Apply gravity
  }

  /**
   * @function Spawn
   * @summary Spawns a set number of snowflakes within the given XYZ region
   * @param {Particle[]} particleList Array of particles to spawn snowflakes in
   * @param {Vector} topLeft Minimum XYZ corner of the region
   * @param {Vector} bottomRight Maximum XYZ corner of the region, note lifetime is derived from Z height of particle
   * @param {number} snowflakes Number of snowflakes to spawn
   * @param {number} intensity Intensity of the wind (directed +X, 0, 0)
   * @param {number} size Width of the snowflake (varies slightly)
   */
  static Spawn(particleList: Particle[], topLeft: Vector, bottomRight: Vector, snowflakes: number, intensity: number = 0.5, size: number = 0.07) {
    const wind = Vector.Multiply(Vector.UnitVectorFromXYZ(1, 0, 0.025), intensity); // Get wind velocity

    // eslint-disable-next-line no-param-reassign
    snowflakes *= RenderSettings.getParticleRatio(); // Alter number of particles based off of render settings

    for (let i = 0; i < snowflakes; i++) {
      const position = Vector.Add(topLeft, new Vector( // Gets a random offset position within the region bounds and adds it to top-left corner position
        (bottomRight.x - topLeft.x) * Math.random(),
        (bottomRight.y - topLeft.y) * Math.random(),
        (bottomRight.z - topLeft.z) * Math.random(),
      ));

      particleList.push(new PSnowfall(position, wind, size, position.z / 2));
    }
  }
}

export { PSnowfall as default };