import Entity from '../Entity';
import { EntityType, ColliderType } from '../Enums';
import { Vector, Ray, TraceResult } from '../math';
import { MessageBus } from '../../messaging/bus';

const normalUp = new Vector(0, 0, 1);
const normalDown = new Vector(0, 0, -1);
const normalRight = new Vector(1, 0, 0);
const normalLeft = new Vector(-1, 0, 0);
const normalForward = new Vector(0, 1, 0);
const normalBackward = new Vector(0, -1, 0);


// Prop - Basic primitive collision box with potential to simulate physics
class Prop extends Entity {
  public Radius: number;
  public BounceBack: number; // If something collides with this, how much of the entities velocity is returned

  public onSurface: boolean; // If this object is resting on top of another object

  public texture: HTMLImageElement;
  public textureUpscale: number;

  constructor(
    pos: Vector,
    public shape: ColliderType = ColliderType.Cylinder, // Is this a box or a cylinder? Defaults to box.
    public Width: number = 0.5, // Default width (radius defaults to this)
    public Height: number = 1, // How tall the object is
    public Depth: number = Width, // Depth defaults to width
  ) {
    super(EntityType.Prop, pos, new Vector(0, 0, 0), new Vector(0, 0, 0));

    if (shape === ColliderType.Cylinder) this.Radius = Width;
    else this.Radius = Math.sqrt(this.Width ** 2 + this.Depth ** 2); // Get maximum radius of box for approximation purposes

    this.BounceBack = 1;

    this.onSurface = false;

    this.texture = null;
    this.textureUpscale = 1;
  }

  // Checks to see if the given Vector is inside of the prop object
  public isPointInside(point: Vector, radiusBoost: number = 0): boolean {
    switch (this.shape) {
      case ColliderType.Cylinder:
        return (
          Vector.Subtract(point, this.Position).lengthXY() <= this.Radius + radiusBoost
          && point.z >= this.Position.z
          && point.z <= (this.Position.z + this.Height)
        );
      default:
        return (
          point.x >= this.Position.x - radiusBoost
          && point.x <= this.Position.x + this.Width + radiusBoost
          && point.y >= this.Position.y - radiusBoost
          && point.y <= this.Position.y + this.Depth + radiusBoost
          && point.z >= this.Position.z
          && point.z <= this.Position.z + this.Height
        );
    }
  }


  /**
   * @function traceProp
   *
   * @summary Applies the given ray trace to all surfaces of the prop until a valid collision is discovered or none was found
   *
   * @param {Ray} ray The ray to trace this prop object with
   * @param {number} radiusBoost If the collision needs to locate another object a set distance away, add the colliding object's radius here
   * @param {boolean} bulletTrace If this trace is being performed for a bullet collision, set this to true
   *
   * @returns {TraceResult} Returns a trace result
   */
  public traceProp(ray: Ray, radiusBoost: number = 0, bulletTrace: boolean = false): TraceResult {
    switch (this.shape) {
      case ColliderType.Cylinder: return this.traceCylinder(ray, radiusBoost, bulletTrace);
      default: return this.traceBox(ray, radiusBoost);
    }
  }
  // To call, use traceProp; Ray traces a cylinder
  private traceCylinder(ray: Ray, radiusBoost: number = 0, bulletTrace: boolean = false): TraceResult {
    const radius = this.Radius + radiusBoost;

    // Top surface collision
    const topTrace = ray.tracePlane(this.getTopPlaneCenter(), normalUp);
    // If it is a cylinder, make sure the hit position was inside the cylinder radius
    if (topTrace.collided && Vector.DistanceXY(topTrace.Position, this.Position) <= radius) {
      topTrace.topFaceCollision = true;
      return topTrace;
    }

    // Bottom surface collision
    const botTrace = ray.tracePlane(this.getBottomPlaneCenter(), normalDown);
    // If it is a cylinder, make sure the hit position was inside the cylinder radius
    if (botTrace.collided && Vector.DistanceXY(botTrace.Position, this.Position) <= radius) {
      return botTrace;
    }

    // If object is a cylinder, get surface normal that corresponds with ray direction
    const trace = ray.traceCylinder(this.Position, radius, bulletTrace); // Traces on cylinders end here
    // Trace should land somewhere within cylinder, top exclusive to avoid colliding whilst on top of multiple, flush surfaces
    if (trace.Position.z < this.Position.z + this.Height && trace.Position.z >= this.Position.z) {
      return trace;
    }
    return new TraceResult(); // Returns if all other tests failed
  }
  // To call, use traceProp; Ray traces a box / rectangular prism
  private traceBox(ray: Ray, radiusBoost: number = 0): TraceResult {
    const minX = this.Position.x - radiusBoost;
    const maxX = this.Position.x + this.Width + radiusBoost;
    const minY = this.Position.y - radiusBoost;
    const maxY = this.Position.y + this.Depth + radiusBoost;
    const minZ = this.Position.z;
    const maxZ = this.Position.z + this.Height;

    const topTrace = ray.tracePlane(this.getTopPlaneCenter(), normalUp);
    if (topTrace.collided // Aligned on Z axis, test X and Y
      && topTrace.Position.x >= minX
      && topTrace.Position.x <= maxX
      && topTrace.Position.y >= minY
      && topTrace.Position.y <= maxY
    ) {
      topTrace.topFaceCollision = true; // Top surface collision
      return topTrace;
    }
    const botTrace = ray.tracePlane(this.getBottomPlaneCenter(), normalDown);
    if (botTrace.collided // Aligned on Z axis, test X and Y
      && botTrace.Position.x >= minX
      && botTrace.Position.x <= maxX
      && botTrace.Position.y >= minY
      && botTrace.Position.y <= maxY
    ) {
      return botTrace;
    }

    // Boost length of ray just by fighter's radius (fighter may collide with surface without position being in it)
    // eslint-disable-next-line no-param-reassign
    ray.length += radiusBoost;

    const rightTrace = ray.tracePlane(this.getRightPlaneCenter(), normalRight);
    if (rightTrace.collided // We're tracing the X axis, so it should always be aligned on the X position; test Y and Z
      && rightTrace.Position.y >= minY
      && rightTrace.Position.y <= maxY
      && rightTrace.Position.z >= minZ
      && rightTrace.Position.z < maxZ // Exclusive of top plane to avoid collisions while on top of flush surfaces
    ) {
      return rightTrace;
    }
    const leftTrace = ray.tracePlane(this.getLeftPlaneCenter(), normalLeft);
    if (leftTrace.collided // We're tracing the X axis, so it should always be aligned on the X position; test Y and Z
      && leftTrace.Position.y >= minY
      && leftTrace.Position.y <= maxY
      && leftTrace.Position.z >= minZ
      && leftTrace.Position.z < maxZ
    ) {
      return leftTrace;
    }
    const forwardTrace = ray.tracePlane(this.getForwardPlaneCenter(), normalForward);
    if (forwardTrace.collided // We're tracing the Y axis, so it should always be aligned on the Y position; test X and Z
      && forwardTrace.Position.x >= minX
      && forwardTrace.Position.x <= maxX
      && forwardTrace.Position.z >= minZ
      && forwardTrace.Position.z < maxZ
    ) {
      return forwardTrace;
    }
    const backwardTrace = ray.tracePlane(this.getBackwardPlaneCenter(), normalBackward);
    if (backwardTrace.collided // We're tracing the Y axis, so it should always be aligned on the Y position; test X and Z
      && backwardTrace.Position.x >= minX
      && backwardTrace.Position.x <= maxX
      && backwardTrace.Position.z >= minZ
      && backwardTrace.Position.z < maxZ
    ) {
      return backwardTrace;
    }

    return new TraceResult(); // Return empty trace result if failed
  }

  // Position this prop based on a trace result and colliding prop
  public CollideWithProp(collision: TraceResult, b: Prop, doVelocityChange: boolean = true) {
    if (!(collision && collision.collided && b)) return;

    // Vertical collisions are different in the fact the fighter is snapped on top of or below
    if (collision.topFaceCollision) { // Top face collisions are marked in collision results for use in riding
      this.Position.z = b.Position.z + b.Height;
      this.Velocity.z = 0;
      this.onSurface = true;
      this.Land();
    } else if (collision.Normal.z < -0.9) { // Bottom face collision, force fighter below object
      this.Position.z = b.Position.z - this.Height;
      this.Velocity.z = 0;
    } else { // Other collisions should snap position around the entity
      switch (b.shape) {
        case ColliderType.Cylinder:
          this.Position = Vector.Add( // Positions object away from surface
            this.Position,
            Vector.Multiply(
              collision.Normal,
              (this.Radius + b.Radius) - Vector.DistanceXY(b.Position, this.Position),
            ),
          );
          break;
        default:
          if (Math.abs(collision.Normal.y) >= 0.5) { // Depth based collision
            this.Position.y = b.Position.y + (this.Radius + b.Depth / 2) * collision.Normal.y;
          } else {
            this.Position.x = b.Position.x + (this.Radius + b.Width / 2) * collision.Normal.x;
          }
      }

      if (doVelocityChange) { // Nullifies velocity that goes directly against the object's surface normal
        this.Velocity = Vector.Subtract(
          this.Velocity,
          Vector.Multiply(
            collision.Normal,
            // Amount of relation between vectors multiplied by length of vector
            Vector.DotProduct(collision.Normal, Vector.UnitVectorXY(this.Velocity)) * this.Velocity.lengthXY(),
          ),
        );
      }
    }
  }

  private getTopPlaneCenter(): Vector { // Up vertically
    return new Vector(0, 0, this.Position.z + this.Height);
  }
  private getBottomPlaneCenter(): Vector { // Down vertically
    return new Vector(0, 0, this.Position.z - 0.001); // Decrement prevents props from clipping under each other while on the same plane
  }
  private getRightPlaneCenter(): Vector { // Holding D
    return new Vector(this.Position.x + this.Width / 2, 0, 0); // Depth and altitude do not matter on an infinite plane
  }
  private getLeftPlaneCenter(): Vector { // Holding A
    return new Vector(this.Position.x - this.Width / 2, 0, 0); // Depth and altitude do not matter on an infinite plane
  }
  private getForwardPlaneCenter(): Vector { // Holding W
    return new Vector(0, this.Position.y + this.Depth / 2, 0); // Depth and altitude do not matter on an infinite plane
  }
  private getBackwardPlaneCenter(): Vector { // Holding S
    return new Vector(0, this.Position.y - this.Depth / 2, 0); // Depth and altitude do not matter on an infinite plane
  }


  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public Land(velocity: number = 0) {}


  public SetTexture(src: string, upscale: number = 1) {
    MessageBus.publish('LoadAsset_Prop', { prop: this, texture: src });
    this.textureUpscale = upscale;
  }
}

export { Prop as default };