// Includes Vector.js

// A standard fighter with basic properties shared by all characters
class Fighter {
    constructor(hp, mass, maxMomentum, radius, height, character, id, position) {
        this.MaxHP = hp;
        this.HP = hp;

        this.Class = character;   //What class this fighter is so we can differentiate between characters
        this.ID = id;         //Player/entity ID of this fighter so we can tell who's who

        this.Mass = mass;     //How much mass this fighter has, used in momentum calculations
        this.MaxMomentum = maxMomentum; //Essentially max speed of character

        this.Radius = radius;   //Collision radius
        this.Height = height;   //Collision height, may be unecessary unless we want the ability to jump over others

        this.Position = position;
        this.Velocity = new Vector(0,0,0);      //Magnitude of velocity * mass should never be > MaxMomentum
        this.Acceleration = new Vector(0,0,0);  //Done for physics calculation, derived by player input and set by server
    }
}

// La Oveja Grande - A tanky character that deals damage primarily off of momentum exchange (running into people at high velocities)
class Sheep extends Fighter {
    constructor(id, position) {
        super(500, 200, 500, 0.5, 0.5, "Sheep", id, position);

    }
}