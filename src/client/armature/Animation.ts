import ArmKey from './Key';

class ArmAnimation {
  private fps: number; // Framerate of animation
  private numFrames: number;

  // If true, interpolate between keyframes
  private interpolate: boolean = true;
  private looping: boolean = true;

  // Current frame of animation
  private frame: number = 0;
  public speed: number = 1; // Speed scale for animation

  /**
   * @summary Creates an animation object
   * @param fps Framerate of animation
   * @param frameStart Initial frame of animation when exporting
   * @param frameEnd Final frame of animation when exporting
   * @param {Map<String, ArmKey>[]} keyframes Keyframes for animation, can point to a global resource to conserve on memory
   */
  public constructor(
    fps: number, frameStart: number, frameEnd: number,
    private keyframes: Map<String, ArmKey>[],
  ) {
    this.fps = fps;
    this.numFrames = frameEnd - frameStart;
  }

  public tick(delta: number): Map<String, ArmKey> {
    this.frame += this.fps * this.speed * delta;

    if (this.frame >= this.numFrames) {
      // If looping, wrap animation back to beginning
      if (this.looping) {
        this.frame %= this.numFrames;
      } else { // Otherwise, simply return last keyframe of animation we have
        this.frame = this.numFrames;
        return this.keyframes[this.numFrames - 1];
      }
    // ...If we're going the other way (negative animation speed)
    } else if (this.frame < 0) {
      if (this.looping) { // Wrap around to end of animation
        this.frame += this.numFrames;
      } else { // Otherwise, return very first keyframe
        this.frame = 0;
        return this.keyframes[0];
      }
    }

    const frameCurrent = Math.floor(this.frame);
    const keysCurrent = this.keyframes[frameCurrent];

    // If we are interpolating keyframes, prepare to blend the next frame
    if (this.interpolate) {
      const frameNext = frameCurrent + 1;
      const keysNext = this.keyframes[frameNext];

      // Alpha blend between keys
      const blend = this.frame - Math.floor(this.frame);

      const blendedKeys = new Map<String, ArmKey>();
      keysCurrent.forEach((keyframe: ArmKey, bone: String) => {
        if (keysNext.has(bone)) { // If we have a key to blend into, blend it!
          const nextKey = keysNext.get(bone);
          blendedKeys.set(bone, ArmKey.blend(keyframe, nextKey, blend));
        }
      });
      return blendedKeys;
    }

    return keysCurrent;
  }

  /**
   * @summary Resets animation back to frame 0
   */
  public reset() {
    this.frame = 0;
  }
  /**
   * @summary Sets animation frame to a given position in the animation
   * @param {number} percent Percent progress of animation, 0 being first frame, 1 being last
   */
  public setPosition(percent: number) {
    this.frame = percent * this.numFrames;
  }

  /**
   * @summary Set special properties on animation, unrelated to export process
   * @param looping If true, animation loops (in either direction)
   * @param interpolate If true, animation interpolates between keyframes
   */
  public setSpecial(looping: boolean = true, interpolate: boolean = true) {
    this.looping = looping;
    this.interpolate = interpolate;
  }
}

export { ArmAnimation as default };