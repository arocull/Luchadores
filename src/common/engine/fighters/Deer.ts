import Vector from '../Vector';
import Fighter from '../Fighter';
import Projectile from '../projectiles/Projectile';

// Deer - A general all-around character who can jump high and fire a constant stream of bullets
class Deer extends Fighter {
  constructor(id: number, position: Vector) {
    super(100, 100, 2000, 0.5, 1, 14, 30, 'Deer', id, position);
  }

  public fireBullet(): Projectile {
    this.BulletShock += 1.2;
    this.BulletCooldown += 0.125;

    return new Projectile('Bullet', this, 5, 1, this.Position, Vector.Multiply(this.AimDirection, 20));
  }
}

export { Deer as default };