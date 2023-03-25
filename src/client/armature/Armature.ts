import ArmAnimation from './Animation';
import ArmBlendNode from './BlendNode';
import ArmBone from './Bone';

class Armature {
  public name: String;

  public root: ArmBone; // Root of bone tree
  public bones: Map<String, ArmBone>; // All bones in list, for keyframe lookups
  public blendTree: ArmBlendNode | ArmAnimation;

  public constructor(name: String, rootBone: ArmBone) {
    this.name = name;
    this.root = rootBone;

    const bList: ArmBone[] = this.root.getChildrenRecursive();
    for (let i = 0; i < bList.length; i++) {
      this.bones.set(name, bList[i]);
    }
  }

  /**
   * @summary Ticks all sub-animations and blend trees, then applies them to the armature
   * @param {number} delta Delta time, in seconds
   */
  public tick(delta: number) {
    const keys = this.blendTree.tick(delta);

    const bonesConst = this.bones;
    keys.forEach((key, boneName) => {
      if (bonesConst.has(boneName)) {
        bonesConst.get(boneName).applyKey(key);
      }
    });
  }
}

export { Armature as default };