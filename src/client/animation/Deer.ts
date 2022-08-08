import { MessageBus } from '../../common/messaging/bus';
import RenderSettings from '../RenderSettings';
import Vector from '../../common/engine/Vector';
import { Fighter } from '../../common/engine/fighters';
import Animator from './Animator';
import { PBulletShell, PBulletFire } from '../particles';
import { BBullet } from '../../common/engine/projectiles';
import ClientAudio from '../audio/ClientAudio';

class AnimDeer extends Animator {
  private inSuplex: boolean = false;
  private shootTimer: number = 0;

  constructor(owner: Fighter) {
    super(owner);

    this.Upscale = 1.7;

    const self: AnimDeer = this; // For referencing in events

    this.animEvents.attach(`Animation_FireBullet${owner.getOwnerID()}`, this.firedBullet);
    this.animEvents.attach(`Animation_SuplexStart${owner.getOwnerID()}`, () => {
      self.inSuplex = true;
    });
    this.animEvents.attach(`Animation_Suplexor${owner.getOwnerID()}`, (eventData:any) => {
      self.inSuplex = false;
      self.suplexLand(eventData);
    });
  }

  protected frameMove() {
    if (this.owner.isFalling()) {
      this.frameFalling();
    } else {
      super.frameMove();
    }
  }
  protected frameFalling() {
    const fallVelo = (this.owner.Velocity.z - 3) / 3;
    const alpha = Math.min(Math.abs(fallVelo), 4);
    this.frame = Math.floor(alpha);
    if (!this.inSuplex) {
      this.frame += 5;
    }
    this.row = 4;
  }
  protected frameAttack() {
    this.frame = this.frameroll(0.5 / this.owner.getBulletCooldown(), 10);
    this.row = 2;
  }
  protected frameAttackMove() {
    this.frame = this.frameroll(10, 10);
    this.row = 3;
  }

  protected tickAttacking(DeltaTime: number): void {
    this.shootTimer += DeltaTime;

    if (this.shootTimer >= 7) {
      this.shootTimer = 0;
      ClientAudio.playSound(this.getAudioName('shoot'), this.owner.Position, 0.3, this.owner);
    }
  }

  private firedBullet(bullet: BBullet) {
    if (!RenderSettings.nextParticle()) return;
    const dir = Vector.Multiply(Vector.UnitVector(bullet.Velocity), -1);
    MessageBus.publish('Effect_NewParticle', new PBulletShell(
      Vector.Add(
        bullet.Position,
        Vector.Multiply(dir, 0.5),
      ),
      dir,
    ));
    MessageBus.publish('Effect_NewParticle', new PBulletFire(bullet.Position, dir, 1));
  }
  // private suplexStart(eventData: any) {
  //   console.log('Suplex start!');
  // }
  private suplexLand(event: any) {
    MessageBus.publish(`CameraShake${event.fighter.getOwnerID()}`, {
      amnt: Math.abs(event.velo) / 5,
      max: 7,
    });
  }
}

export { AnimDeer as default };