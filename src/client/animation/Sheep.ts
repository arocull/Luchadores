import Animator from './Animator';
import { Fighter, Sheep } from '../../common/engine/fighters';
import { MessageBus } from '../../common/messaging/bus';
import { PShockwave } from '../particles';
import { Vector } from '../../common/engine/math';
import ClientAudio from '../audio/ClientAudio';

class AnimSheep extends Animator {
  private timeSpentMoving: number;
  private hitCooldown: number; // Hit cooldown, to debounce desyncs

  constructor(owner: Fighter) {
    super(owner);

    this.Upscale = 1.3;
    this.sfxNameIdle = 'relax';

    this.timeSpentMoving = 0;
    this.hitCooldown = 0;

    // Sheep has no attack or attack move animations, so reassign them to be idle and move animations respectively
    this.frameAttack = this.frameIdle;
    this.frameAttackMove = this.frameMove;

    this.bindAnimEvent('Animation_Hit', (killingBlow: boolean) => this.sfxHit(killingBlow));
  }

  public Tick(DeltaTime: number) {
    super.Tick(DeltaTime);
    this.hitCooldown -= DeltaTime;

    const sheep: Sheep = <Sheep>(this.owner); // Generate shockwave effect upon landing
    // TODO: Hook up to event bind?
    if (sheep.landingVelocity > 0) {
      MessageBus.publish('Effect_NewParticle', new PShockwave(Vector.Add(sheep.Position, new Vector(0, 0.1, 0)), sheep.landingVelocity * 1.5));
      sheep.landingVelocity = 0;
    }

    // Threshold velocity
    const rollThreshold = (this.owner.MaxMomentum / this.owner.Mass) / 3;
    if (this.owner.Velocity.lengthXY() > rollThreshold) {
      this.timeSpentMoving += DeltaTime;
    } else {
      this.timeSpentMoving -= DeltaTime * 3;
    }

    // If we spend 6 seconds or more rolling, play an audio and reset timer
    if (this.timeSpentMoving > 6) {
      this.timeSpentMoving = 0;
      ClientAudio.playSound(this.getAudioName('hum'), this.owner.Position, 0.4, this.owner);
    } else if (this.timeSpentMoving < 0) {
      this.timeSpentMoving = 0;
    }
  }

  public sfxHit(killingBlow: boolean) {
    if (!killingBlow && this.hitCooldown < 0) {
      this.hitCooldown = 0.15;
      ClientAudio.playSound(this.getAudioName('hit'), this.owner.Position, 0.5, this.owner);
    }
  }
}

export { AnimSheep as default };