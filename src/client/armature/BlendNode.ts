import Animation from './Animation';
import ArmKey from './Key';

class ArmBlendNode {
  constructor(
    private base: Animation | ArmBlendNode,
    private goal: Animation | ArmBlendNode,
    public blend: number = 0.5,
    private add: boolean = false,
    private resetOnZero: boolean = true, // If true, resets unblended animations
  ) {}

  public tick(delta: number): Map<String, ArmKey> {
    // If we're adding two animations, there is no need for blending
    if (this.add) {
      const keys = new Map<String, ArmKey>();
      const keysBase = this.base.tick(delta);
      const keysGoal = this.goal.tick(delta);

      // For each bone key, attempt to add goal animation on top of base
      keysBase.forEach((key, bone) => {
        if (keysGoal.has(bone)) { // If we have a key to add, add it
          keys.set(bone, ArmKey.add(key, keysGoal.get(bone)));
        } else { // Otherwise, just use base key
          keys.set(bone, key);
        }
      });

      return keys;
    }

    // If we have zero blend, don't bother ticking secondary animation
    if (this.blend <= 0) {
      if (this.resetOnZero) {
        this.goal.reset();
      }
      return this.base.tick(delta);
    }
    // If we're fully blended, don't bother ticking base animation
    if (this.blend >= 1) {
      if (this.resetOnZero) {
        this.base.reset();
      }
      return this.goal.tick(delta);
    }

    const keys = new Map<String, ArmKey>();
    const keysBase = this.base.tick(delta);
    const keysGoal = this.goal.tick(delta);

    // For each bone key, blend base animation with goal
    keysBase.forEach((key, bone) => {
      if (keysGoal.has(bone)) { // If we have a key to add, add it
        keys.set(bone, ArmKey.blend(key, keysGoal.get(bone), this.blend));
      } else { // Otherwise, just use base key
        keys.set(bone, key);
      }
    });

    return keys;
  }

  /**
 * @summary Resets child animations and/or nodes
 */
  public reset() {
    this.base.reset();
    this.goal.reset();
  }
}

export { ArmBlendNode as default };