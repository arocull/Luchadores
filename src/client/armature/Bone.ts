import { Vector, Quaternion } from '../../common/engine/math';
import ArmKey from './Key';

class ArmBone {
  public name: String;

  // Animation properties

  public position: Vector;
  public rotation: Quaternion;
  public scale: Vector;

  // Drawing properties
  public length: number = 0.1; // Length of bone
  public thickness: number = 0.1;
  public color: String = '#FFFFFF'; // Draw color of bone
  public drawable: boolean = false;

  // Physics properties
  public mass: number = 1; // Mass of bone, in kg
  public center: Vector = new Vector();
  public physics: boolean = false;

  public children: ArmBone[];

  /**
   * @summary Default constructor for bone. Takes bare minimum properties
   * @param name Name of bone
   * @param {Vector} position Position of bone
   * @param {Quaternion} rotation Rotation of bone
   * @param {Vector} scale Scale of bone
   */
  public constructor(
    name: String = 'Bone',
    position: Vector = new Vector(),
    rotation: Quaternion = Quaternion.identity,
    scale: Vector = new Vector(),
  ) {
    this.name = name;
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
  }

  public initializeDrawing(
    length: number, thickness: number, color: string,
  ) {
    this.length = length;
    this.thickness = thickness;
    this.color = color;
    this.drawable = true;
  }

  public initializePhysics(
    mass: number, center: Vector,
  ) {
    this.mass = mass;
    this.center = center;
    this.physics = true;
  }

  /**
   * @summary Returns ALL descendants of this bone, including self as first index
   * @param {ArmBone[]} bones Initial list of bones to append to
   */
  public getChildrenRecursive(bones: ArmBone[] = []): ArmBone[] {
    bones.push(this);
    for (let i = 0; i < this.children.length; i++) {
      // Do we need to set this array here, or will all elements be appended to the same array?
      bones[i].getChildrenRecursive(bones);
    }

    return bones;
  }

  public applyKey(key: ArmKey) {
    this.position = key.position;
    this.rotation = key.rotation;
    this.scale = key.scale;
  }
}

export { ArmBone as default };