import Entity from '../common/engine/Entity';
import { Fighter, Flamingo } from '../common/engine/fighters/index';
import { Projectile } from '../common/engine/projectiles/index';
import { EntityType, FighterType } from '../common/engine/Enums';
import { TypeEnum } from '../common/events/index';
import { encoder } from '../common/messaging/serde';


function encodeEntity(obj: Entity): ArrayBuffer {
  const result: any = {
    type: TypeEnum.Entity,
    position: obj.Position,
    velocity: obj.Velocity,
    acceleration: obj.Acceleration,
  };

  if (obj.type === EntityType.Fighter) {
    const fight = <Fighter>obj;
    result.type = TypeEnum.Entity_Fighter + fight.getCharacter(); // 425 + (1 to 3), automatically sets type based off of fighter class

    result.playerID = fight.getOwnerID();
    result.class = fight.getCharacter();

    if (fight.isRanged()) {
      result.attacking = fight.Firing;
      result.aim = fight.getAim();
      result.cooldown = fight.getBulletCooldown();

      if (fight.getCharacter() === FighterType.Flamingo) {
        const flam = <Flamingo>fight;
        result.breath = flam.getBreath();
        result.breathing = flam.isBreathing();
      }
    }
  } else if (obj.type === EntityType.Projectile) {
    const proj = <Projectile>obj;
    result.type = TypeEnum.Entity_Projectile;
    result.ownerId = proj.getOwnerID();
    result.projectileType = proj.projectileType;
    result.lifetime = proj.getLifetime();
  }

  return encoder(result);
}

export { encodeEntity as default };