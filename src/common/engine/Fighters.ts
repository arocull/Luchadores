// Includes Vector.js
import Vector from './Vector';

// A standard fighter with basic properties shared by all characters
export class Fighter {
  public MaxHP: number;

  public HP: number;

  public Class: string;

  public ID: number;

  public Mass: number;

  public MaxMomentum: number;

  public JumpVelocity: number;

  public Radius: number;

  public Height: number;

  public Flipped: boolean;

  public Position: Vector;

  public Velocity: Vector;

  public Acceleration: Vector;


  constructor(hp: number, mass: number, maxMomentum: number, radius: number, height: number, jumpVelo: number, character: string, id: number, position: Vector) {
    this.MaxHP = hp;
    this.HP = hp;

    this.Class = character; // What class this fighter is so we can differentiate between characters
    this.ID = id; // Player/entity ID of this fighter so we can tell who's who

    this.Mass = mass; // How much mass this fighter has, used in momentum calculations
    this.MaxMomentum = maxMomentum; // Essentially max speed of character
    this.JumpVelocity = jumpVelo;

    this.Radius = radius; // Collision radius
    this.Height = height; // Collision height, may be unecessary unless we want the ability to jump over others
    this.Flipped = false; // Do we draw them facing leftward or rightward?

    this.Position = position;
    this.Velocity = new Vector(0, 0, 0); // Magnitude of velocity * mass should never be > MaxMomentum
    this.Acceleration = new Vector(0, 0, 0); // Done for physics calculation, derived by player input and set by server
  }


  public TakeDamage(dmg: number) {
    this.HP -= dmg;

    if (this.HP < 0) this.HP = 0;
  }

  public CollideWithFighter(hit: Fighter, momentum: number) {
    if (this.Class == 'Sheep' && momentum > this.MaxMomentum / 2) hit.TakeDamage(momentum / this.MaxMomentum * 50);
  }
}

// La Oveja Grande - A tanky character that deals damage primarily off of momentum exchange (running into people at high velocities)
export class Sheep extends Fighter {
  constructor(id: number, position: Vector) {
    super(500, 200, 500, 0.5, 1, 8, 'Sheep', id, position);
  }
}
