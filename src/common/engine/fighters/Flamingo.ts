import Vector from '../Vector';
import Fighter from '../Fighter';
import Fire from '../projectiles/Fire';

// Flamenacre - Flamenco + Acre (Flamingo + Spicy) - A tall, quicker character who breathes fire and is a general spaz
class Flamingo extends Fighter {
  private breath: number;
  private maxBreath: number;
  private breathing: boolean;

  constructor(id: number, position: Vector) {
    super(100, 120, 2500, 0.5, 2, 20, 30, 'Flamingo', id, position);

    this.maxBreath = 50;
    this.breath = 50;
  }

  public canFirebullet() {
    return (super.canFirebullet() && this.breath >= 1 && !this.breathing);
  }
  public fireBullet(): Fire {
    this.BulletShock += 0.625;
    this.BulletCooldown += 0.05;
    this.breath -= 1;

    if (this.breath < 1) this.breathing = true;

    const pos = Vector.Clone(this.Position);
    pos.z += this.Height * 0.75;
    if (this.Flipped === true) pos.x -= this.Radius;
    else pos.x += this.Radius;

    this.Velocity = Vector.Subtract(this.Velocity, Vector.Multiply(this.AimDirection, 0.2));
    if (this.AimDirection.x < 0) this.Flipped = true;
    else if (this.AimDirection.x > 0) this.Flipped = false;

    const dir = Vector.UnitVectorFromXYZ(this.AimDirection.x + (Math.random() - 0.5) / 3, this.AimDirection.y + (Math.random() - 0.5) / 3, 0);
    dir.z = -1;

    return new Fire(pos, dir, this);
  }

  public tickCooldowns(DelaTime: number) {
    super.tickCooldowns(DelaTime);

    this.breath += DelaTime * 8;
    if (this.breath > this.maxBreath) this.breath = this.maxBreath;
    if (this.breath > this.maxBreath / 2) this.breathing = false;
  }
}

export { Flamingo as default };