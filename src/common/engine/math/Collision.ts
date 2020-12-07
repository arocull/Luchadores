import Vector from '../Vector';
import Ray from './Ray';
import TraceResult from './TraceResult';
import Prop from '../props/Prop';
import Fighter from '../Fighter';

// Internal Functions //
/* eslint-disable no-param-reassign */

/**
 * @function CollisionTrace
 *
 * @summary Does a collision trace upon prop B using the movement ray of prop A
 * @description Tests object B to see if it is in the path of of object A, and then performs a collision test from prop A's trajectory onto prop B
 *
 * @param {Prop}  a   The object that is in motion
 * @param {Prop}  b   The object to test the prop A's trajectory against for collisions
 * @param {Ray}   ray Object A's trajectory, used for collision testing and detection
 *
 * @returns {TraceResult} Returns a bullet trace result, or null if the initial test failed
 */
function CollisionTrace(a: Prop, b: Prop, ray: Ray): TraceResult {
  // See if the point is anywhere close enough to the ray for an intersection
  if (ray.pointDistanceXY(b.Position) < a.Radius + b.Radius) { // Bottom center of fighter
    if (b.Position.z > a.Position.z) { // B is above A, meaning we need to trace the top of the objects
      const pos = Vector.Clone(a.Position);
      pos.z += a.Height;
      ray.start.z += a.Height;
      ray.end.z += a.Height;
      return b.traceProp(ray, a.Radius);
    }
    return b.traceProp(ray, a.Radius); // Bottom trace
  }

  return null; // Basic point tests failed, return null
}
/**
 * @function CollisionTraceBullet
 *
 * @summary Simple collision test and trace for bullets
 * @description Tests the object to see if it is in the path of the bullet's trajectory, and then performs a collision test on the the given prop
 *
 * @param {Prop}  a   The object to test the bullet trajectory against for collisions
 * @param {Ray}   ray The bullet trajectory used for collision testing and detection
 *
 * @returns {TraceResult} Returns a bullet trace result, or null if the initial test failed
 */
function CollisionTraceBullet(a: Prop, ray: Ray): TraceResult {
  if (ray.pointDistanceXY(a.Position) < a.Radius) { // Make sure point of projectile is along a trajectory that faces the prop
    return a.traceProp(ray, 0, true); // If so, trace prop--could potentially increase bullet thickness using the radius boost
  }

  return null; // Return null if simple point distance test failed
}

// Collides two fighters, makes a ride b and does momentum transfers
// If the collision is a repeat, momentum is not transferred, but positioning and ridership is still calculated
function CollideFighters(a: Fighter, b: Fighter, info: TraceResult) {
  if (!(a.rodeThisTick === b || b.rodeThisTick === a)) { // If they are not riding each other, treat it like a standard collision
    const massA = a.Mass + a.passengerMass;
    const massB = b.Mass + b.passengerMass;
    let moment1 = a.Velocity.length() * massA; // Momentum of fighter A
    let moment2 = b.Velocity.length() * massB; // Momentum of fighter B

    // Apply ridership momentum additions
    if (a.rodeThisTick) moment1 += a.rodeThisTick.Velocity.length() * massA;
    if (b.rodeThisTick) moment2 += b.rodeThisTick.Velocity.length() * massB;

    a.CollideWithFighter(b, moment1); // Trigger collision events
    b.CollideWithFighter(a, moment2);

    // Momentum Transfer--should we swap momentums or sum them (essentially, what collision do we want)
    const aVelo = Vector.Multiply(Vector.UnitVector(b.Velocity), moment2 / massA);
    b.Velocity = Vector.Multiply(Vector.UnitVector(a.Velocity), moment1 / massB);
    a.Velocity = aVelo;

    a.lastCollision = b;
    b.lastCollision = a;
  }

  // Slight bounceback on air collisions used to prevent characters from getting stuck in eachother
  if (info.topFaceCollision) { // A landed on B
    a.JustLanded = true; // Allows jump
    a.riding = b;
    a.CollideWithProp(info, b, false);
  // Position fighter a around fighter b accordingly (note velocity change already occurred)
  } else if (b.rodeThisTick !== a && b.rodeThisTick !== a) { // Don't let the rider push the fighter around though
    a.CollideWithProp(info, b, false);
  }
}
/* eslint-enable no-param-reassign */

export { CollisionTrace, CollisionTraceBullet, CollideFighters };