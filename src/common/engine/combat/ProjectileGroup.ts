import { Vector } from '../math';
import { Projectile } from '../projectiles';

/**
 * @class ProjectileGroup
 * @summary An struct that contains information about a particular group of projectiles.
 */
class ProjectileGroup {
  public projectiles: Projectile[];

  public position: Vector; // Average position of group
  public velocity: Vector; // Average velocity of group
  public acceleration: Vector; // Average acceleration of group
  public damage: number; // Average damage per projectile of the group

  public radius: number; // Average radius of the bullet group
  public area: number; // Area of the bullet group (PI * (radius ** 2))--treated as 2D rather than 3D volume due to levelness of battlefield
  public density: number; // Number of bullets divided by area of the group
  public spread: number; // Average dot product between the bullets and the averaged direction of the group--1 for all in same direction, 0 for no correlation

  public expectedPosition: Vector; // Expected position of the bullet group after T seconds
  public expectedDensity: number; // Expected density of the bullet group after T seconds

  constructor() {
    this.projectiles = [];
  }

  /**
   * @function getAveragePosition
   * @summary Calculates and updates the average position of the projectile group
   * @returns {Vector} Returns an updated average position of the projectile group
   */
  public getAveragePosition(): Vector {
    this.position = new Vector();

    for (let i = 0; i < this.projectiles.length; i++) {
      this.position = Vector.Add(this.position, this.projectiles[i].Position);
    }

    this.position = Vector.Divide(this.position, this.projectiles.length);
    return this.position;
  }


  /**
   * @function calculate
   * @summary Calculates average position, velocity, acceleration, radius, area, density, and average expected position and density
   * @param {number} t Time in seconds in the future to predict bullet positions (must be greater than zero)
   */
  public calculate(t: number = 0.1) {
    this.position = new Vector();
    this.velocity = new Vector();
    this.acceleration = new Vector();
    this.damage = 0;

    // Tally up values
    for (let i = 0; i < this.projectiles.length; i++) {
      this.position = Vector.Add(this.position, this.projectiles[i].Position);
      this.velocity = Vector.Add(this.velocity, this.projectiles[i].Velocity);
      this.acceleration = Vector.Add(this.acceleration, this.projectiles[i].Acceleration);
      this.damage += this.projectiles[i].Damage;
    }
    // Perform averaging
    this.position = Vector.Divide(this.position, this.projectiles.length);
    this.velocity = Vector.Divide(this.velocity, this.projectiles.length);
    this.acceleration = Vector.Divide(this.acceleration, this.projectiles.length);
    this.damage /= this.projectiles.length;

    this.expectedPosition = this.getExpectedPosition(this.position, this.velocity, this.acceleration, t);

    // Average radius and spread
    const baseDir = Vector.UnitVector(this.velocity);
    this.radius = 0;
    this.spread = 0;
    let expectedRadius = 0;
    for (let i = 0; i < this.projectiles.length; i++) {
      const proj = this.projectiles[i];

      this.spread += Vector.DotProduct(Vector.UnitVector(proj.Velocity), baseDir);
      this.radius += Vector.Distance(proj.Position, this.position);
      expectedRadius += Vector.Distance(
        this.getExpectedPosition(proj.Position, proj.Velocity, proj.Acceleration, t),
        this.expectedPosition,
      );
    }

    this.radius /= this.projectiles.length;
    this.spread /= this.projectiles.length;
    expectedRadius /= this.projectiles.length;

    this.area = Math.PI * (this.radius ** 2);
    const expectedArea = Math.PI * (expectedRadius ** 2);

    this.density = this.projectiles.length / this.area;
    this.expectedDensity = this.projectiles.length / expectedArea;
  }


  /**
   * @function getExpectedPosition
   * @summary Gets the expected position of entity proper
   * @param {Vector} pos Position of the object
   * @param {Vector} velo Velocity of the object
   * @param {Vector} accel Acceleration of the object
   * @param {number} t Time in seconds in the future to predict the position
   * @returns {Vector} Expected position of the entity
   */
  private getExpectedPosition(pos: Vector, velo: Vector, accel: Vector, t: number): Vector {
    return Vector.Add(
      pos, // Entity position
      Vector.Add( // Gets change in position
        Vector.Multiply(accel, (t ** 2) / 2),
        Vector.Multiply(velo, t),
      ),
    );
  }


  /**
   * @function purge
   * @summary Removes any expired projectiles from the projectile array
   */
  public purge() {
    for (let i = 0; i < this.projectiles.length; i++) {
      if (this.projectiles[i].finished) { // Remove expired projectiles
        this.projectiles.splice(i, 1);
        i--;
      }
    }
  }

  /**
   * @function merge
   * @summary Merges this projectile group into a parent group
   * @param {ProjectileGroup} parentGroup Parent group to merge this group's projectiles into
   */
  public merge(parentGroup: ProjectileGroup) {
    for (let i = 0; i < this.projectiles.length; i++) {
      parentGroup.projectiles.push(this.projectiles[i]);
    }
    parentGroup.getAveragePosition();
  }
}

export { ProjectileGroup as default };