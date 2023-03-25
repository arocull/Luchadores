import { Quaternion, Vector } from '../../common/engine/math';

class ArmKey {
  constructor(
    public position: Vector = new Vector(),
    public rotation: Quaternion = new Quaternion(),
    public scale: Vector = new Vector(1, 1, 1),
  ) {}

  /**
   * @summary Blends between two keyframes
   * @param {ArmKey} a Initial keyframe
   * @param {ArmKey} b End keyframe
   * @param {number} alpha Blending factor
   */
  public static blend(a: ArmKey, b: ArmKey, alpha: number): ArmKey {
    return new ArmKey(
      Vector.Lerp(a.position, b.position, alpha),
      // Should we be using SLerp? It's more accurate, but less efficient
      // ...and, our animations are likely going to be pre-baked,
      // so it might not even be noticeable
      Quaternion.NLerp(a.rotation, b.rotation, alpha),
      Vector.Lerp(a.position, b.position, alpha),
    );
  }

  /**
   * @summary Adds B ontop of A
   * @param a Key A
   * @param b Key B
   */
  public static add(a: ArmKey, b: ArmKey): ArmKey {
    return new ArmKey(
      Vector.Add(a.position, b.position),
      Quaternion.Add(a.rotation, b.rotation),
      Vector.Add(a.scale, b.scale),
    );
  }
}

export { ArmKey as default };