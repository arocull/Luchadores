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

*/
class Flamingo extends Fighter {
  private breath: number;
  private maxBreath: number;
  private breathing: boolean;

  constructor(id: number, position: Vector) {
    super(80, 80, 1300, 0.4, 2, 20, 35, FighterType.Flamingo, id, position);

    // Breath limits player from spewing too much fire at a time
    this.maxBreath = 50;
    this.breath = 50;
    this.breathing = false;
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

    const fireVelo = Vector.Clone(this.Velocity); // Take sample now to ignore recoil
    // Inherit velocity from bottom of stack as well
    const stackBottom = this.getBottomOfStack();
    if (stackBottom !== this) {
      fireVelo.x += stackBottom.Velocity.x;
      fireVelo.y += stackBottom.Velocity.y;
    }
    fireVelo.z = 0;

    // Get position to fire from
    const pos = Vector.Clone(this.Position);
    pos.z += this.Height * 0.5;
    if (this.Flipped === true) pos.x -= this.Radius * 1.2;
    else pos.x += this.Radius * 1.2;

    // Recoil and sprite-flipping
    this.Velocity = Vector.Subtract(this.Velocity, Vector.Multiply(this.AimDirection, 0.1));

    // Get randomized direction
    const dir = Vector.UnitVectorFromXYZ(
      this.AimDirection.x + (Random.getFloat() - 0.5) / 3,
      this.AimDirection.y + (Random.getFloat() - 0.5) / 3,
      0,
    );
    dir.z = -1;

    const proj = new BFire(pos, dir, this);
    proj.Velocity = Vector.Add(proj.Velocity, fireVelo);
    MessageBus.publish('NewProjectile', proj);
    return proj;
  }

  public tickCooldowns(DelaTime: number) {
    super.tickCooldowns(DelaTime);

    this.breath += DelaTime * 8;
    if (this.breath > this.maxBreath) this.breath = this.maxBreath;
    if (this.breath > this.maxBreath / 2) this.breathing = false; // If breath has reached at least half capacity, allow fire-breathing again
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