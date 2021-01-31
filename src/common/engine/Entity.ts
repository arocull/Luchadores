import Vector from './Vector';
import { EntityType } from './Enums';

/**
 * @class Entity
 * @summary A typed object with physics data
 * @description
 Default properties that should be replicated to client

- Position
- Velocity
- Acceleration

*/
class Entity {
  constructor(public type: EntityType, public Position: Vector, public Velocity: Vector, public Acceleration: Vector) {

  }

  /**
   * @function inRegion
   * @summary Returns true if the position of this entity falls within the given XYZ bounds
   * @param {Vector} minimums Lowest positional values, bottom left corner
   * @param {Vector} maximums Highest positional values, top right corner
   * @returns {boolean} Returns a boolean
   */
  public inRegion(minimums: Vector, maximums: Vector): boolean {
    return (
      this.Position.x > minimums.x
      && this.Position.y > minimums.y
      && this.Position.z > minimums.z
      && this.Position.x < maximums.x
      && this.Position.y < maximums.y
      && this.Position.z < maximums.z
    );
  }
  /**
   * @function inRegionXY
   * @summary Returns true if the position of this entity falls within the given XY bounds
   * @param {Vector} minimums Lowest positional values, bottom left corner
   * @param {Vector} maximums Highest positional values, top right corner
   * @returns {boolean} Returns a boolean
   */
  public inRegionXY(minimums: Vector, maximums: Vector): boolean {
    return (
      this.Position.x > minimums.x
      && this.Position.y > minimums.y
      && this.Position.x < maximums.x
      && this.Position.y < maximums.y
    );
  }
}

export { Entity as default };