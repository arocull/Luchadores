import Random from '../common/engine/Random';
import Entity from '../common/engine/Entity';
import World from '../common/engine/World';
import { Fighter, Flamingo } from '../common/engine/fighters/index';
import { Projectile } from '../common/engine/projectiles/index';
import { EntityType, FighterType } from '../common/engine/Enums';
import { TypeEnum } from '../common/events/index';
import { IWorldState } from '../common/events/events';
import { encoder } from '../common/messaging/serde';

function encodeEntity(obj: Entity): any {
  const result: any = {
    position: obj.Position,
    velocity: obj.Velocity,
    acceleration: obj.Acceleration,
  };

  if (obj.type === EntityType.Fighter) {
    const fight = <Fighter>obj;

    result.ownerId = fight.getOwnerID();
    result.class = fight.getCharacter();
    result.attacking = fight.Firing;
    result.aim = fight.getAim();
    result.cooldown = fight.getBulletCooldown();
    result.specialNumber = 0;
    result.specialBoolean = false;

    if (fight.getCharacter() === FighterType.Flamingo) {
      const flam = <Flamingo>fight;
      result.specialNumber = flam.getBreath();
      result.specialBool = flam.isBreathing();
    }
  } else if (obj.type === EntityType.Projectile) {
    const proj = <Projectile>obj;
    result.ownerId = proj.getOwnerID();
    result.projectileType = proj.projectileType;
    result.lifetime = proj.getLifetime();
  }

  return result;
}

// Encodes the entire WorldState into a Protobuff
// May need to include time packet was sent?
function encodeWorldState(world: World): ArrayBuffer {
  const result: IWorldState = {
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

export { encodeWorldState as default };