import Entity from '../Entity';
import { Ray, Vector } from '../math';
import { Fighter } from '../fighters';
import { EntityType } from '../Enums';
import ProjectileGroup from './ProjectileGroup';
import World from '../World';
import { Projectile } from '../projectiles';

const timeFrame = 0.1; // Ahead-of-time window for guesstimation of positioning and movement
const maxProjectileGroupRadius = 1.25; // Maximum projectile group grouping

/**
 * @interface ThreatObject
 * @summary Interface that carries an entity and its associated threat level
 * @property {Entity} object Object the threat is attached to
 * @property {number} threat Calculated threat that object poses
 */
export interface ThreatObject {
  object: Entity;
  threat: number;
}

/**
 * @class
 * @name FightObserver
 *
 * @summary Used to quickly pull data from the battlefield
 *
 * @description The FightObserver is a class used to observer fights going on. Features include:
 * - Getting the most threatening fighters
 * - Detecting high-density bullet areas
 * - Making movement predictions of dangerous objects
 * - Determining the 'intensity' of a battle
 */
class FightObserver {
  /**
   * @constructor
   * @param {World} world World to make observations from
   */
  constructor(public world: World) {

  }

  // FIGHTERS //
  /**
   * @function GetThreateningFighters
   * @summary Returns a list of fighters that are potentially threatening the player (attacking nearby)
   * @param {Fighter} player Player to detect approaching fighters for
   * @param {Fighter[]} fighters Fighters to evaluate as threats
   * @param {number} limit Maximum number of fighters to return
   * @param {number} t Time in seconds for future estimations, must be greater than 0
   * @returns {ThreatObject[]} Returns a ThreatObject array of limit length
   */
  public GetThreateningFighters(player: Fighter, fighters: Fighter[] = this.world.Fighters, limit: number = 3, t: number = timeFrame): ThreatObject[] {
    const futurePos = this.estimatePosition(player, t); // Calculate player's estimated position ahead of time
    const threats: any[] = [];

    // First, create a list of fighters and corresponding threats
    for (let i = 0; i < fighters.length; i++) {
      if (fighters[i] && fighters[i] !== player) {
        threats.push({ // Create threat object structure to push outward
          object: fighters[i], // Fighter to look at
          threat: this.determineFighterThreat(player, fighters[i], futurePos, t), // Fighter's threat level
        } as ThreatObject); // Add it to the array
      }
    }

    // Sort threats from most threatening to least threatening
    threats.sort((a: any, b: any) => {
      if (a.threat > b.threat) return 1;
      if (a.threat < b.threat) return -1;
      return 0;
    });

    return threats.splice(0, limit);
  }

  /**
   * @function GetTotalFighterThreat
   * @summary Returns a numeric threat level
   * @param {Fighter} player Player to detect approaching fighters for
   * @param {Fighter[]} fighters Fighters to evaluate as threats
   * @param {number} t Time in seconds for future estimations, must be greater than 0
   * @returns {number} Returns the total threat level from the given array of fighters
   */
  public GetTotalFighterThreat(player: Fighter, fighters: Fighter[] = this.world.Fighters, t: number = timeFrame): number {
    const futurePos = this.estimatePosition(player, t); // Calculate player's estimated position ahead of time

    let threat = 0; // Total threat level
    for (let i = 0; i < fighters.length; i++) {
      if (fighters[i] && fighters[i] !== player) {
        threat += this.determineFighterThreat(player, fighters[i], futurePos, t); // Fighter's threat level
      }
    }

    return threat;
  }

  /**
   * @function determineFighterThreat
   * @summary Determines the 'threat' level of a fighter
   * @param {Fighter} a Fighter to observe from
   * @param {Fighter} b Fighter to determine threat level for
   * @param {Vector} aFuture Fighter to obersve's estimated future position
   * @param {number} t Time ahead to estimate, must be greater than 0
   * @returns {number} Returns the estimated threat level of the fighter
   */
  public determineFighterThreat(a: Fighter, b: Fighter, aFuture: Vector, t: number = timeFrame): number {
    const dist = Vector.DistanceXY(a.Position, b.Position); // Distance between A and B currently
    const bFuture = this.estimatePosition(b, t); // B's estimated future position
    const distF = Vector.DistanceXY(aFuture, bFuture); // Projected distance between A and B in future
    const dir = Vector.UnitVectorXY(Vector.Subtract(a.Position, b.Position)); // Direction from B to A

    const dangerThreshold = (a.Radius + b.Radius) * 8; // An estimate distance between the two fighters for consideration of threat


    // As distances close, threat approaches 1 (do this for both distances, then multiply by 3)
    let threat = 2.3 * Math.max((1 - Math.sqrt(dist / dangerThreshold)) + (1 - Math.sqrt(distF / dangerThreshold)), 0);

    // If the enemy is firing bullets
    if (b.Firing) {
      threat += Math.max(Vector.DotProduct(b.getAim(), dir), -0.5) * 3.5; // Bullets are fairly dangerous when fired in general direction
    }

    // How much higher is their momentum, proportional to mine?
    const momentumThreat = 0.9 * ((Math.max(b.Velocity.lengthXY() * b.Mass, 1) / Math.max(a.Velocity.lengthXY() * a.Mass, 1)) / a.MaxMomentum);
    // Again, directionally-correlated, less of a threat if not aimed toward the player
    threat += Vector.DotProduct(Vector.UnitVectorXY(b.Velocity), dir) * momentumThreat;

    return threat;
  }

  /**
   * @function estimatePosition
   * @summary Gives a fast and sloppy estimate of an entity's position after t seconds
   * @param {Entity} a Entity to estimate position for
   * @param {number} t Time in seconds in the future to estimate the position for, must be greater than 0
   * @returns {Vector} The estimated position of entity A at time T
   */
  public estimatePosition(a: Entity, t: number = timeFrame): Vector {
    if (a.Position.z <= 0 && a.type === EntityType.Fighter) { // If they are on the ground and a fighter, apply friction
      const len = a.Velocity.lengthXY() + a.Acceleration.lengthXY() * t; // Approximate velocity length

      const frictionalForce = Math.max(3 - Math.log(len / 2 + 1), 1) * this.world.Map.Friction; // Calculated frictional force

      // Obtain VERY ROUGHLY GUESSED friction
      const friction = Vector.Multiply(Vector.UnitVectorXY(a.Velocity), frictionalForce).clamp(0, len / t);

      const accel = Vector.Add(friction, a.Acceleration);

      return Vector.Add(
        a.Position, // Entity position
        Vector.Add( // Gets change in position
          Vector.Multiply(accel, (t ** 2) / 2),
          Vector.Multiply(a.Velocity, t), // Factor in velocity
        ),
      );
    }

    return Vector.Add(
      a.Position, // Entity position
      Vector.Add( // Gets change in position
        Vector.Multiply(a.Acceleration, (t ** 2) / 2),
        Vector.Multiply(a.Velocity, t),
      ),
    );
  }


  // BULLETS //
  /**
   * @function formProjectileGroups
   * @summary Forms a rough list of most clustered projectiles within the given area
   *
   * @description Compares distances between bullets and attempts to group them according to proximity.
   * Returns an array of the grouped projectiles with calculations made
   *
   * @param {Vector} topLeftLimit Top left corner of rectangle to form projectile groups in
   * @param {Vector} bottomRightLimit Bottom right corner of rectangle to form projectile groups in
   * @returns {ProjectileGroup[]} Returns a list of projectile groups within the given area
   */
  public formProjectileGroups(topLeftLimit: Vector, bottomRightLimit: Vector): ProjectileGroup[] {
    const groups: ProjectileGroup[] = []; // List to return

    const bullets: Projectile[] = []; // All valid projectiles within screen area

    // First find all bullets within the given range
    for (let i = 0; i < this.world.Bullets.length; i++) {
      if (this.world.Bullets[i]) {
        const pos = this.world.Bullets[i].Position;

        // Make sure bullet position falls within bounds
        if (pos.x > topLeftLimit.x && pos.x < bottomRightLimit.x && pos.y < topLeftLimit.y && pos.y > bottomRightLimit.y) {
          bullets.push(this.world.Bullets[i]);
        }
      }
    }

    // Group clusters of 3 bullets, or add remaining bullets to existing clusters
    for (let x = 0; x < bullets.length; x++) {
      let foundPairing = false;
      for (let y = x + 1; y < bullets.length; y++) { // Don't iterate anywhere below X (already been iterated)
        for (let z = y + 1; z < bullets.length; z++) { // Don't iterate anywhere below Y (already been iterated)
          const center = Vector.Divide(Vector.Add(Vector.Add(bullets[x].Position, bullets[y].Position), bullets[z].Position), 3);
          if ( // Check if all bullets are within a valid distance from each other
            Vector.Distance(center, bullets[x].Position) < maxProjectileGroupRadius
            && Vector.Distance(center, bullets[y].Position) < maxProjectileGroupRadius
            && Vector.Distance(center, bullets[z].Position) < maxProjectileGroupRadius
          ) { // If all bullets are within a valid distance, add them to the groups
            const group: ProjectileGroup = new ProjectileGroup();
            group.projectiles.push(bullets[x], bullets[y], bullets[z]);

            bullets.splice(x, 1);
            bullets.splice(y, 1);
            bullets.splice(z, 1);
            x--; y--; z--;

            group.getAveragePosition();

            groups.push(group);
            foundPairing = true;
            break; // Continue ahead since these 3 bullets are now already in groups (close groups are paired later on)
          }
        }
        if (foundPairing) break;
      }
    }

    // Push remaining bullets into nearby groups (if possible)
    for (let x = 0; x < bullets.length; x++) {
      for (let y = 0; y < groups.length; y++) {
        if (Vector.Distance(groups[y].Position, bullets[x].Position) <= maxProjectileGroupRadius) {
          groups[y].projectiles.push(bullets[x]);
          groups[y].getAveragePosition(); // Update average position

          // Remove bullet so it is not counted again
          bullets.splice(x, 1);
          x--;
          break;
        }
      }
    }

    // Merge close groups
    for (let x = 0; x < groups.length; x++) {
      for (let y = x + 1; y < groups.length; y++) {
        if (Vector.Distance(groups[x].Position, groups[y].Position) < maxProjectileGroupRadius * (2 / 3)) {
          groups[y].merge(groups[x]);
          groups.splice(y, 1);
          y--;
        }
      }
    }

    // Finally, perform calculations for final groups
    for (let i = 0; i < groups.length; i++) {
      groups[i].calculate(timeFrame);
    }

    return groups;
  }


  /**
   * @function GetThreateningProjectileGroups
   * @summary Returns a given number of the most threatening projectile groups
   * @param {Fighter} player Player to detect approaching fighters for
   * @param {ProjectileGroup[]} groups Bullet groups to evaluate as threats
   * @param {number} limit Maximum number of fighters to return
   * @param {number} t Time in seconds for future estimations, must be greater than 0
   * @returns {ThreatObject[]} Returns a ThreatObject array of 'limit' length
   */
  public GetThreateningProjectileGroups(player: Fighter, groups: ProjectileGroup[], limit: number = 3, t: number = timeFrame): ThreatObject[] {
    const threats: any[] = [];

    // First, create a list of groups and corresponding threats
    for (let i = 0; i < groups.length; i++) {
      if (groups[i]) {
        threats.push({ // Create threat object structure to push outward
          object: groups[i], // Group to look at
          threat: this.determineProjectileGroupThreat(player, groups[i], t), // Group's threat level
        } as ThreatObject); // Add it to the array
      }
    }

    // Sort threats from most threatening to least threatening
    threats.sort((a: any, b: any) => {
      if (a.threat > b.threat) return 1;
      if (a.threat < b.threat) return -1;
      return 0;
    });

    return threats.splice(0, limit); // Return limit amount
  }

  /**
   * @function determineProjectileGroupThreat
   * @summary Determines the numerical threat of a projectile group
   * @param {Fighter} a Fighter to observe from
   * @param {ProjectileGroup} b Projectile group to determine threat for
   * @param {number} t Time in seconds
   * @returns {number} Estimated numerical threat level of the given projectile group
   */
  public determineProjectileGroupThreat(a: Fighter, b: ProjectileGroup, t: number = timeFrame): number {
    const bFuture = this.estimatePosition(b, t); // B's estimated future position
    const dir = Vector.UnitVectorXY(Vector.Subtract(a.Position, b.Position)); // Direction from B to A

    const trace: Ray = new Ray(b.Position, bFuture);
    const radius = a.Radius + b.radius;

    // Threat scales from 1 (object is in trace's way perfectly) to 0 (object is 2 * radius away from trace)
    let threat = Math.max(1 - trace.pointDistance(a.Position) / (2 * radius), 1);

    // Object should also be in front of bullet trace (minimizes threat to 0 if object is behind bullets)
    threat *= Math.max(Vector.DotProduct(trace.direction, dir), 0);

    // Sum current and expected density, subtract off the spread (as spread approaches zero, bullets are flying in opposite directions)
    // Then finally factor in damage (average damage * density should provide total damage of grouping)
    threat *= (b.density + b.expectedDensity - (1 - b.spread)) * b.damage;

    return threat;
  }
}

export { FightObserver };