import RenderSettings from '../RenderSettings';
import { MessageBus } from '../../common/messaging/bus';
import Vector from '../../common/engine/Vector';
import Animator from './Animator';
import { PFire, PSmoke } from '../particles';
import ClientAudio from '../audio/ClientAudio';

class AnimFlamingo extends Animator {
  private playingAudio: boolean = false;

  public Tick(DeltaTime: number) {
    super.Tick(DeltaTime);

    const attacking = this.owner.Firing && this.owner.getSpecialNumber() > 0 && !this.owner.getSpecialBoolean();
    if (attacking && !this.playingAudio) {
      ClientAudio.playSound('Flamingo/Scream', this.owner.Position, 0.4, this.owner);
      this.playingAudio = true;
    } else if (!attacking && this.playingAudio) {
      ClientAudio.stopSound('Flamingo/Scream', this.owner);
      this.playingAudio = false;
    }
  }

  protected triggerUniqueIdle() {
    super.triggerUniqueIdle();

    ClientAudio.playSound('Flamingo/Squawk', this.owner.Position, 0.35);
  }

  protected frameFalling() {
    this.frame = 6;
    this.row = 1;
  }
  protected frameAttack() {
    this.frame = this.frameroll(5, 5);
    this.row = 3;
    if (this.owner.isFalling()) {
      this.frame += 5;
    }
  }
  protected frameAttackMove() {
    if (this.owner.isFalling()) {
      this.frame = 5 + this.frameroll(5, 5, this.globalTimer);
      this.row = 3;
      return;
    }
    this.frame = this.frameroll(10, 10);
    this.row = 2;
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