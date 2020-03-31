import Vector from './Vector';
import { EntityType } from './Enums';

class Entity {
  constructor(public type: EntityType, public Position: Vector, public Velocity: Vector, public Acceleration: Vector) {

  }
}

export { Entity as default };