import Animator from './Animator';
import { Fighter } from '../../common/engine/fighters';

class AnimSheep extends Animator {
  constructor(owner: Fighter) {
    super(owner);

    this.Upscale = 1.3;

    // Sheep has no attack or attack move animations, so reassign them to be idle and move animations respectively
    this.frameAttack = this.frameIdle;
    this.frameAttackMove = this.frameMove;
  }
}

export { AnimSheep as default };