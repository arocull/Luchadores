import Vector from '../Vector';
import Fighter from '../Fighter';
import Projectile from '../projectiles/Projectile';

// La Oveja Grande - A tanky character that deals damage primarily off of momentum exchange (running into people at high velocities)
class Deer extends Fighter {
  constructor(id: number, position: Vector) {
    super(100, 70, 800, 0.5, 1, 8, 40, 'Deer', id, position);
  }

  public FireBullet(): Projectile {
    const bullet = new Projectile('Bullet', this, 5, 1, this.Position, Vector.Multiply(this.AimDirection, 10));
    this.BulletShock += 10;
    return bullet;
  }
}

export { Deer as default };