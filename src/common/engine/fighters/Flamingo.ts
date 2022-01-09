import Vector from '../Vector';
import Fighter from '../Fighter';
import { FighterType } from '../Enums';
import Random from '../Random';
import BFire from '../projectiles/Fire';
import { MessageBus } from '../../messaging/bus';

/* Flamenacre - Flamenco + Acre (Flamingo + Spicy) - A taller character who breathes fire and is a general spaz

Properties that need to be replicated from server to client:
- Class Type
- Player ID
- Position
- Velocity
- Acceleration
- Firing
- Aim Direction
- Breath
- Breathing

Flamingo's traits:
- Low health and mass
- Lower maximum velocity
- Tall and thin
- Medium move acceleration
- High jump velocity
- Lots of air control

*/
class Flamingo extends Fighter {
  private breath: number;
  private maxBreath: number;
  private breathing: boolean;

  constructor(id: number, position: Vector) {
    super(80, 50, 875, 0.4, 2, 20, 35, 0.7, FighterType.Flamingo, id, position);
    // 50 kilograms, top speed of 17.5 units per second

    // Breath limits player from spewing too much fire at a time
    this.maxBreath = 50;
    this.breath = 50;
    this.breathing = false;

    this.getSpecialNumber = this.getBreath;
    this.getSpecialBoolean = this.isBreathing;
    this.setSpecialStates = this.setBreath;
  }

  public EarnKill() {
    super.EarnKill();

    this.breath = this.maxBreath; // Refill breath meter upon earning a kill
    this.breathing = false;
  }

  public canFirebullet() {
    return (super.canFirebullet() && this.breath >= 1 && !this.breathing);
  }
  public fireBullet(): BFire {
    this.BulletShock += 0.6;
    this.BulletCooldown += 0.05;
    this.breath -= 1;

    // If flamingo runs out of breath, halt all fire-breathing
    if (this.breath < 1) this.breathing = true;

    if (this.AimDirection.x < 0) this.Flipped = true;
    else if (this.AimDirection.x > 0) this.Flipped = false;

    const pos = Vector.Clone(this.Position);
    let fireVelo = new Vector(0, 0, 0);

    // Get randomized bullet direction
    let dir = new Vector(0, 0, 0);

    // Produce jump boost flames
    if (this.isFalling()) {
      fireVelo.z = -3;

      dir = Vector.UnitVectorFromXYZ(
        (Random.getFloat() - 0.5),
        (Random.getFloat() - 0.5),
        -4,
      );

      // Fire should shoot straight down, we'll leave it positioned at the base of Flamingo

      // Apply a strong recoil downward
      this.Velocity = Vector.Subtract(this.Velocity, Vector.Multiply(dir, 2.15));
    } else { // Otherwise, act as normal
      fireVelo = Vector.Clone(this.Velocity); // Take sample now to ignore recoil

      // Inherit velocity from bottom of stack as well
      const stackBottom = this.getBottomOfStack();
      if (stackBottom) {
        fireVelo.x += stackBottom.Velocity.x;
        fireVelo.y += stackBottom.Velocity.y;
      }
      fireVelo.z = 0;

      // Only inherit velocity that is close to the direction Flamingo wants to fire (use dot product)
      fireVelo = Vector.Multiply(fireVelo, Math.max(Vector.DotProduct(Vector.UnitVectorXY(fireVelo), this.AimDirection), 0));

      // Get position to fire from
      pos.z += this.Height * 0.5;
      if (this.Flipped === true) pos.x -= this.Radius * 1.2;
      else pos.x += this.Radius * 1.2;

      // Direction of bullet
      dir = Vector.UnitVectorFromXYZ(
        this.AimDirection.x + (Random.getFloat() - 0.5) / 3,
        this.AimDirection.y + (Random.getFloat() - 0.5) / 3,
        0,
      );
      dir.z = -1;

      // Apply recoil
      if (stackBottom) { // Flamingo can use fire to help accelerate character they're stacked ontop of
        stackBottom.Velocity = Vector.Subtract(stackBottom.Velocity, Vector.Multiply(dir, 0.15));
      } else {
        this.Velocity = Vector.Subtract(this.Velocity, Vector.Multiply(dir, 0.15));
      }
    }

    const proj = new BFire(pos, dir, this);
    proj.Velocity = Vector.Add(proj.Velocity, fireVelo);
    MessageBus.publish('NewProjectile', proj);
    MessageBus.publish(`CameraShake${this.getOwnerID()}`, {
      amnt: 0.7,
      max: 15,
    });
    return proj;
  }

  public tickCooldowns(DelaTime: number) {
    super.tickCooldowns(DelaTime);

    this.breath += DelaTime * 8;
    if (this.breath > this.maxBreath) this.breath = this.maxBreath;
    if (this.breath > this.maxBreath / 2 && this.breathing) {
      this.breathing = false; // If breath has reached at least half capacity, allow fire-breathing again

      // Play inhale sound
      // TODO: Should this only play for client's character?
      MessageBus.publish('Audio_General', {
        sfxName: 'Flamingo/Inhale',
        pos: this.Position,
        vol: 0.4,
        owner: this,
      });
    }
  }

  public getBreath(): number {
    return this.breath;
  }
  public isBreathing(): boolean {
    return this.breathing;
  }

  public setBreath(newBreath: number, newBreathing: boolean) {
    this.breath = newBreath;
    this.breathing = newBreathing;
  }
}

export { Flamingo as default };