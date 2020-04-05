import Random from '../common/engine/Random';
import Entity from '../common/engine/Entity';
import World from '../common/engine/World';
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
    result.type = TypeEnum.Entity_Fighter; // 425 + (1 to 3), automatically sets type based off of fighter class

    result.playerID = fight.getOwnerID();
    result.class = fight.getCharacter();
    result.attacking = fight.Firing;
    result.aim = fight.getAim();
    result.cooldown = fight.getBulletCooldown();
    result.specialNumber = 0;
    result.specialBool = false;

    if (fight.getCharacter() === FighterType.Flamingo) {
      const flam = <Flamingo>fight;
      result.specialNumber = flam.getBreath();
      result.specialBool = flam.isBreathing();
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

function encodeWorldState(world: World): ArrayBuffer {
  const result: any = {
    type: TypeEnum.WorldState,
    randomSeed: Random.getSeed(),
    randomIndex: Random.getIndex(),
    mapWidth: world.Map.Width,
    mapHeight: world.Map.Height,
    mapFriction: world.Map.Friction,
    mapId: 0,
    fighters: [],
    projectiles: [],
  };

  for (let i = 0; i < world.Fighters.length; i++) {
    result.fighters.push(encodeEntity(world.Fighters[i]));
  }
  for (let i = 0; i < world.Bullets.length; i++) {
    result.projectiles.push(encodeEntity(world.Bullets[i]));
  }

  return encoder(result);
}

export { encodeEntity, encodeWorldState };