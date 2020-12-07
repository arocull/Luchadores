import Entity from '../Entity';
import { Vector } from '../math';
import { Fighter } from '../fighters';
import { EntityType } from '../Enums';
import World from '../World';

const timeFrame = 0.1; // Ahead-of-time window for guesstimation of positioning and movement

/**
 * @class
 * @name FightObserver
 *
 * @summary Used to quickly pull data from the battlefield
 *
 * @description The FightObserver is a class used to observer fights going on. Features include:
 * - Getting nearest incoming fighters
 * - Detecting high-density bullet areas
 * - Determining the intensity of a battle
 */
class FightObserver {
  /**
   * @constructor
   * @param {World} world World to make observations from
   */
  constructor(public world: World) {

  }

  /**
   * @function GetThreateningFighters
   * @summary Returns a list of fighters that are potentially threatening the player (attacking nearby)
   * @param {Fighter} player Player to detect approaching fighters for
   * @param {Fighter[]} fighters Fighters to evaluate as threats
   * @param {number} limit Maximum number of fighters to return
   * @param {number} t Time in seconds for future estimations, must be greater than 0
   * @returns {Fighter[]} Returns a Fighter array of 'limit' length
   */
  public GetThreateningFighters(player: Fighter, fighters: Fighter[] = this.world.Fighters, limit: number = 3, t: number = timeFrame): Fighter[] {
    const futurePos = this.estimatePosition(player, t); // Calculate player's estimated position ahead of time
    const threats: any[] = [];

    // First, create a list of fighters and corresponding threats
    for (let i = 0; i < fighters.length; i++) {
      if (fighters[i] && fighters[i] !== player) {
        const obj: any = {};
        obj.fighter = fighters[i]; // Fighter to look at
        obj.threat = this.determineFighterThreat(player, fighters[i], futurePos, t); // Fighter's threat level
        threats.push(obj); // Add it to the array
      }
    }

    // Sort threats from most threatening to least threatening
    threats.sort((a: any, b: any) => {
      if (a.threat > b.threat) return 1;
      if (a.threat < b.threat) return -1;
      return 0;
    });

    const results: Fighter[] = []; // Pick top results
    for (let i = 0; i < limit && i < threats.length; i++) {
      results.push(threats[i].fighter);
    }

    return results;
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
      threat += Math.max(Vector.DotProduct(b.getAim(), dir), -0.5) * 3; // Bullets are fairly dangerous when fired in general direction
    }

    // How much higher is their momentum, proportional to mine?
    const momentumThreat = (Math.max(b.Velocity.lengthXY() * b.Mass, 1) / Math.max(a.Velocity.lengthXY() * a.Mass, 1)) / a.MaxMomentum;
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
}

export { FightObserver as default };