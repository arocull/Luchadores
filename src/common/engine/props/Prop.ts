import Entity from '../Entity';
import { EntityType, ColliderType } from '../Enums';
import { Vector, Ray, TraceResult } from '../math';

const normalUp = new Vector(0, 0, 1);
const normalDown = new Vector(0, 0, -1);


// Prop - Basic primitive collision box with potential to simulate physics
// TODO: Should we have the Fighter class extend this??? I made sure property names are the same as Fighter's incase we decide to
class Prop extends Entity {
  public Radius: number;
  public UsePhysics: boolean; // If false, it will not simulate physics itself, but other objects may collide with it
  public BounceBack: number; // If something collides with this, how much of the entities velocity is returned

  constructor(
    pos: Vector,
    public shape: ColliderType = ColliderType.Prism, // Is this a box or a cylinder? Defaults to box.
    public Width: number = 0.5, // Default width (radius defaults to this)
    public Height: number = 0.5, // How tall the object is
    public Depth: number = Width, // Depth defaults to width
  ) {
    super(EntityType.Prop, pos, new Vector(0, 0, 0), new Vector(0, 0, 0));

    if (shape === ColliderType.Cylinder) this.Radius = Width;
    else this.Radius = Math.sqrt(this.Width ** 2 + this.Depth ** 2); // Get maximum radius of box for approximation purposes

    this.UsePhysics = false;
    this.BounceBack = 0.7;
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
          point.x >= this.Position.x
          && point.x <= this.Position.x + this.Width
          && point.y >= this.Position.y
          && point.y <= this.Position.y + this.Depth
          && point.z >= this.Position.z
          && point.z <= this.Position.z + this.Height
        );
    }
  }


  // Applies the given ray trace to all surfaces of the prop until a valid collision is discovered or none was found
  public traceProp(ray: Ray, radiusBoost: number = 0): TraceResult {
    const result = new TraceResult();

    const radius = this.Radius + radiusBoost;

    // Top surface collisision
    const topTrace = ray.tracePlane(this.getTopPlaneCenter(), normalUp);
    if (topTrace.collided) {
      switch (this.shape) {
        case ColliderType.Cylinder: // If it is a cylinder, make sure the hit position was inside the cylinder radius
          if (Vector.DistanceXY(topTrace.Position, this.Position) <= radius) return topTrace;
          break;
        default: // If it is a prism, make sure X and Y coordinates are inside the face
          if (
            topTrace.Position.x >= this.Position.x
            && topTrace.Position.x <= this.Position.x + this.Width
            && topTrace.Position.y >= this.Position.z
            && topTrace.Position.y <= this.Position.y + this.Width
          ) {
            return topTrace;
          }
      }
    }

    // Buttom surface collision
    const botTrace = ray.tracePlane(this.getBottomPlaneCenter(), normalDown);
    if (botTrace.collided) {
      switch (this.shape) {
        case ColliderType.Cylinder: // If it is a cylinder, make sure the hit position was inside the cylinder radius
          if (Vector.DistanceXY(botTrace.Position, this.Position) <= radius) return botTrace;
          break;
        default: // If it is a prism, make sure X and Y coordinates are inside the face
          if (
            botTrace.Position.x >= this.Position.x
            && botTrace.Position.x <= this.Position.x + this.Width
            && botTrace.Position.y >= this.Position.z
            && botTrace.Position.y <= this.Position.y + this.Width
          ) {
            return botTrace;
          }
      }
    }

    // If object is a cylinder, get surface normal that corresponds with ray direction
    if (this.shape === ColliderType.Cylinder) {
      return ray.traceCylinder(this.Position, radius); // Traces on cylinders end here
    }

    // Box collisions not implemented yet

    return result;
  }

  private getTopPlaneCenter(): Vector {
    const vec = Vector.Clone(this.Position);
    vec.z += this.Height * 0.99;
    return vec;
  }
  private getBottomPlaneCenter(): Vector {
    return this.Position;
  }
}

export { Prop as default };