import Vector from './Vector';
import { EntityType } from './Enums';

/*
Default properties that should be replicated to client

- Position
- Velocity
- Acceleration

*/
class Entity {
  constructor(public type: EntityType, public Position: Vector, public Velocity: Vector, public Acceleration: Vector) {

  }
}

export { Entity as default };