import Animator from './Animator';
import { Fighter, Sheep } from '../../common/engine/fighters';
import { MessageBus } from '../../common/messaging/bus';
import { PShockwave } from '../particles';
import { Vector } from '../../common/engine/math';

class AnimSheep extends Animator {
  constructor(owner: Fighter) {
    super(owner);

    this.Upscale = 1.3;

    // Sheep has no attack or attack move animations, so reassign them to be idle and move animations respectively
    this.frameAttack = this.frameIdle;
    this.frameAttackMove = this.frameMove;
  }

  public Tick(DeltaTime: number) {
    super.Tick(DeltaTime);

    const sheep: Sheep = <Sheep>(this.owner); // Generate shockwave effect upon landing
    if (sheep.landingVelocity > 0) {
      MessageBus.publish('Effect_NewParticle', new PShockwave(Vector.Add(sheep.Position, new Vector(0, 0.1, 0)), sheep.landingVelocity));
      sheep.landingVelocity = 0;
    }
  }
}

export { AnimSheep as default };