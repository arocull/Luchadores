import { Vector } from '../math';
import Fighter from '../Fighter';

// AOEBlast - Object used for tracking and dolling out AOE damage caused by Luchador attacks
// This is here so we do not have to implement custom functionality per-Luchador within the World class
// Has properties that can help shape the blast (i.e. grounded, raycasting, etc)
class AOEBlast {
  constructor(
    public position: Vector,
    public radius: number,
    public damage: number,
    public owner: Fighter,
    private momentum: number = 0, // If greater than zero, this change in momentum will be applied to all Luchadores within the radius
    private grounded: boolean = false, // If true, this effect will only deal damage to fighters that are not falling
    private doFalloff: boolean = false, // If true, damage + force falls off from 1 in center to 0 at radius
    private selfDamage: boolean = false, // If true, this effect will deal damage to its owner as well
  ) {

  }

  // Applies the AOE Blast's effects to all given fighters
  public apply(fighters: Fighter[]) {
    for (let i = 0; i < fighters.length; i++) {
      if (
        fighters[i] // Fighter must exist
        && (fighters[i] !== this.owner || this.selfDamage) // Fighter shouldn't be owner (unless self-damage is on)
        && Vector.Distance(this.position, fighters[i].Position) < (this.radius + fighters[i].Radius) // Fighter needs to be in radius
        && (!this.grounded || (!fighters[i].isFalling() && fighters[i].riding !== this.owner)) // 'Grounded' must not be required, or fighter needs to be not falling
      ) {
        let falloff: number = 1;

        // Calculate falloff (distance apart divided by max radius)
        if (this.doFalloff) falloff = 1 - Vector.Distance(this.position, fighters[i].Position) / (this.radius + fighters[i].Radius);

        if (this.damage !== 0) fighters[i].TakeDamage(this.damage * falloff, this.owner); // Apply damage

        if (this.momentum !== 0) { // Only do this if momentum to be applied is not zero (attractive or repulsive forces allowed)
          fighters[i].ApplyMomentum( // Apply momentum
            Vector.Multiply( // Apply momentum magnitude
              Vector.UnitVector(Vector.Subtract(fighters[i].Position, this.position)), // Get force direction
              falloff * this.momentum, // Get momentum magnitude
            ),
          );
        }
      }
    }
  }
}

export { AOEBlast as default };