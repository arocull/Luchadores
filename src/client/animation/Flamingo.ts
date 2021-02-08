import RenderSettings from '../RenderSettings';
import { MessageBus } from '../../common/messaging/bus';
import Vector from '../../common/engine/Vector';
import Animator from './Animator';
import { PFire, PSmoke } from '../particles';
import AnimationState from './AnimationState';
import ClientAudio from '../audio/ClientAudio';

class AnimFlamingo extends Animator {
  private screamAudio: HTMLAudioElement = null;
  private playingAudio: boolean = false;

  public Tick(DeltaTime: number) {
    super.Tick(DeltaTime);

    const attacking: boolean = (this.realState === AnimationState.Attacking || this.realState === AnimationState.AttackingMoving);
    if (attacking && !this.playingAudio) {
      this.screamAudio = ClientAudio.playSound('Flamingo/Scream', this.owner.Position, 0.3);
      this.playingAudio = true;
    } else if (!attacking && this.screamAudio) {
      this.screamAudio.pause();
      this.screamAudio.currentTime = 0;
      this.playingAudio = false;
    }
  }

  protected triggerUniqueIdle() {
    super.triggerUniqueIdle();

    ClientAudio.playSound('Flamingo/Squawk', this.owner.Position, 0.4);
  }

  protected frameFalling() {
    this.frame = 6;
    this.row = 1;
  }

  protected tickUniqueIdle() {
    if (RenderSettings.nextParticle()) {
      const fire = new PFire(
        Vector.Add(this.owner.Position, new Vector(
          (Math.random() - 0.5) * this.owner.Radius * 1.5,
          this.owner.Radius / 2,
          this.owner.Height * 0.75,
        )),
        new Vector(0, 0, 1),
        0.75,
      );
      MessageBus.publish('Effect_NewParticle', fire);
    }
  }
  protected tickAttacking() { // Flamingo - Fire on back and smoke breathing
    if (this.timerTick % 3 === 1 && RenderSettings.nextParticle()) {
      MessageBus.publish('Effect_NewParticle', new PFire(
        Vector.Add(this.owner.Position, new Vector(
          (Math.random() - 0.5) * this.owner.Radius * 1.4,
          this.owner.Radius / 2,
          this.owner.Height * 0.75,
        )),
        new Vector(0, 0, 1),
        0.75,
      ));
    } else if (this.timerTick % 5 === 4 && RenderSettings.nextParticle()) {
      let dir = 1;
      if (this.owner.Flipped === true) dir = -1;

      const pos = Vector.Clone(this.owner.Position);
      pos.z += this.owner.Height * 0.5;
      pos.x += this.owner.Radius * 1.2 * dir;
      pos.y -= 0.1;

      MessageBus.publish('Effect_NewParticle', new PSmoke(pos, new Vector(3 * dir, 0, -1.75), 1));
    }
  }
}

export { AnimFlamingo as default };