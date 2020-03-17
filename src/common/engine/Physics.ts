// Inludes Vector.js and Fighters.js
import Vector from './Vector';
import Fighter from './Fighter';
import Projectile from './projectiles/Projectile';
import Map from './Map';

// Tick the physics of a list of fighters by X seconds
class Physics {
  static Tick(DeltaTime: number, fighters: Fighter[], bullets: Projectile[], map: Map) {
    for (let i = 0; i < fighters.length; i++) {
      const obj = fighters[i];
      const maxSpeed = obj.MaxMomentum / obj.Mass;

      // First, apply any potential accelerations due to physics, start with friction as base for optimization
      let accel = new Vector(0, 0, 0);

      // Gravity
      if (obj.Position.z > 0 || obj.Velocity.z > 0) accel.z += -50;

      // If fighter is out of bounds, bounce them back (wrestling arena has elastic walls)
      // Should it be proportional to distance outward?
      if (obj.Position.x < 0) accel.x += 100;
      else if (obj.Position.x > map.Width) accel.x -= 100;

      if (obj.Position.y < 0) accel.y += 100;
      else if (obj.Position.y > map.Height) accel.y -= 100;

      // Note friction is Fn(or mass * gravity) * coefficient of friction, then force is divided by mass for accel
      if (obj.Position.z <= 0) {
        const leveled = new Vector(obj.Velocity.x, obj.Velocity.y, 0);
        const frict = Vector.Multiply(Vector.UnitVector(leveled), -map.Friction).clamp(0, obj.Velocity.length() * 3);
        accel = Vector.Add(accel, frict);
      }


      // Add physics-based acceleration and player input acceleration, and then calculate position change
      accel = Vector.Add(obj.Acceleration, accel);
      let deltaX = Vector.Add(
        Vector.Multiply(accel, (DeltaTime ** 2) / 2),
        Vector.Multiply(obj.Velocity, DeltaTime),
      );

      // If they attempted to move faster than their max momentum, clamp their movement (should do this?)
      if (deltaX.length() > maxSpeed * DeltaTime) {
        deltaX = Vector.Multiply(Vector.UnitVector(deltaX), maxSpeed * DeltaTime);
      }

      obj.Position = Vector.Add(obj.Position, deltaX);
      obj.Velocity = Vector.Add(obj.Velocity, Vector.Multiply(accel, DeltaTime));

      // Terminal velocity
      if (obj.Velocity.length() > maxSpeed) {
        obj.Velocity = Vector.Multiply(Vector.UnitVector(obj.Velocity), maxSpeed);
      }

      if (obj.Acceleration.x < -1) obj.Flipped = true;
      else if (obj.Acceleration.x > 1) obj.Flipped = false;

      if (obj.Position.z < 0) {
        obj.Position.z = 0;
        obj.Velocity.z = 0;
      }
    }

    for (let i = 0; i < bullets.length; i++) {
      if (bullets[i].Finished) {
        bullets.splice(i, 1);
        i--;
      } else bullets[i].Tick(DeltaTime);
    }

    // Compute collisions last after everything has moved (makes it slightly more "fair?")
    // Should we do raycasts from previous positions to make sure they do not warp through eachother and avoid collision?
    //      - Note: This is only an issue if DeltaTime and Velocity are too great
    for (let i = 0; i < fighters.length; i++) {
      const a = fighters[i];

      // Fighter collisions
      for (let j = i + 1; j < fighters.length; j++) { // If the entity was already iterated through by main loop, should not need to do it again
        const b = fighters[j];
        if (
          Vector.DistanceXY(a.Position, b.Position) <= a.Radius + b.Radius
          && (a.Position.z <= b.Position.z + b.Height)
        ) { // If they are within collision range...
          const moment1 = a.Velocity.length() * a.Mass; // Momentum of fighter A
          const moment2 = b.Velocity.length() * b.Mass; // Momentum of fighter B

          a.CollideWithFighter(b, moment1); // Trigger collision events
          b.CollideWithFighter(a, moment2);

          // Momentum Transfer--should we swap momentums or sum them (essentially, what collision do we want)
          const aVelo = Vector.Multiply(Vector.UnitVector(b.Velocity), moment2 / a.Mass);
          b.Velocity = Vector.Multiply(Vector.UnitVector(a.Velocity), moment1 / b.Mass);
          a.Velocity = aVelo;

          const seperate = Vector.UnitVector(Vector.Subtract(b.Position, a.Position));
          a.Velocity = Vector.Add(a.Velocity, Vector.Multiply(seperate, -150 / a.Mass));
          b.Velocity = Vector.Add(b.Velocity, Vector.Multiply(seperate, 150 / b.Mass));
        }
      }

      // Bullet collisions
      for (let j = 0; j < bullets.length; j++) {
        const b = bullets[j];

        const start = Vector.Subtract(b.Position, b.DeltaPosition);
        const len = b.DeltaPosition.length();
        const dir = Vector.UnitVector(b.DeltaPosition);

        // Normally we would shoot a ray at a cylinder, but that's kind of difficult
        // So instead, we will test 3 point along the bullet trajectory to check if has collided with the fighter or not
        for (let q = 0; q < 3; q++) {
          const pos = Vector.Add(start, Vector.Multiply(dir, q * (len / 3)));
          if (
            Vector.DistanceXY(a.Position, pos) <= a.Radius
            && (pos.z <= a.Position.z + a.Height)
          ) {
            b.Hit(a);
            break;
          }
        }
      }
    }
  }
}

export { Physics as default };
