import { MessageBus } from '../../common/messaging/bus';
import RenderSettings from '../RenderSettings';
import Vector from '../../common/engine/Vector';
import { Fighter } from '../../common/engine/fighters';
import Animator from './Animator';
import { PBulletShell, PBulletFire } from '../particles';
import { BBullet } from '../../common/engine/projectiles';

class AnimDeer extends Animator {
  private bulletChannel: string;

  constructor(owner: Fighter) {
    super(owner);

    this.Upscale = 1.7;

    // Deer has no attack or attack move animations, so reassign them to be idle and move animations respectively
    this.frameAttack = this.frameIdle;
    this.frameAttackMove = this.frameMove;

    this.bulletChannel = `Animation_FireBullet${owner.getOwnerID()}`;

    MessageBus.subscribe(this.bulletChannel, this.firedBullet);
  }
  public destruct() {
    MessageBus.unsubscribe(this.bulletChannel, this.firedBullet);
  }

  private firedBullet(bullet: BBullet) {
    if (!RenderSettings.nextParticle()) return;
    const dir = Vector.Multiply(Vector.UnitVector(bullet.Velocity), -1);
    MessageBus.publish('Effect_NewParticle', new PBulletShell(bullet.Position, dir));
    MessageBus.publish('Effect_NewParticle', new PBulletFire(bullet.Position, dir, 1));
  }
}

export { AnimDeer as default };