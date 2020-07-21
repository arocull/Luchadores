import Animator from './Animator';
import { Fighter } from '../../common/engine/fighters';
import { MessageBus } from '../../common/messaging/bus';
import { Vector } from '../../common/engine/math';
import { PFire, PSmoke } from '../particles';
import RenderSettings from '../RenderSettings';

class AnimSoccerball extends Animator {
  constructor(owner: Fighter) {
    super(owner);

    this.FrameWidth = 256;
    this.FrameHeight = 256;
    this.Upscale = 1;

    this.row = 0;

    this.frameMove = (() => {
      if (!RenderSettings.nextParticle()) return;
      const fire = new PFire(
        this.owner.Position,
        Vector.Multiply(Vector.UnitVector(this.owner.Velocity), -1),
        Math.min(this.owner.Velocity.length() / 70, 2),
      );
      MessageBus.publish('Effect_NewParticle', fire);
    });
    this.frameIdle = (() => {
      if (!RenderSettings.nextParticle()) return;
      const smoke = new PSmoke(
        this.owner.Position,
        Vector.Multiply(Vector.UnitVector(this.owner.Acceleration), -this.owner.getSpecialNumber() / 12),
        this.owner.getSpecialNumber() / 75,
      );
      MessageBus.publish('Effect_NewParticle', smoke);
    });
    this.frameFalling = this.frameMove;
    this.frameAttack = this.frameMove;
    this.frameAttackMove = this.frameMove;
  }

  public Tick(DeltaTime: number) {
    this.timerTick++;
    this.timer += DeltaTime * (this.owner.getSpecialNumber() + this.owner.Velocity.length());

    // The soccerball has no animations, it only knows spin
    // this.frame = Math.floor(this.timer * 5) % 5;

    if (this.owner.getSpecialBoolean()) this.frameIdle(); // If frozen in place, leave a smoke trail
    else if (this.owner.Velocity.length() > 5) this.frameMove(); // If moving, leave a fire trail
  }
}

export { AnimSoccerball as default };