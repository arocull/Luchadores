import Vector from './Vector';

class Entity {
  constructor(public Type: string, public Position: Vector, public Velocity: Vector, public Acceleration: Vector) {

  }
}

export { Entity as default };