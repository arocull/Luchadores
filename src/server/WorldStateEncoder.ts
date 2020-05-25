import Random from '../common/engine/Random';
import Entity from '../common/engine/Entity';
import World from '../common/engine/World';
import { Fighter } from '../common/engine/fighters';
import { Projectile } from '../common/engine/projectiles';
import { EntityType } from '../common/engine/Enums';
import { Timer } from '../common/engine/time/Time';
import { TypeEnum } from '../common/events';
import { IWorldState } from '../common/events/events';

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
    result.specialNumber = fight.getSpecialNumber();
    result.specialBoolean = fight.getSpecialBoolean();
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
function encodeWorldState(world: World): IWorldState {
  const result: IWorldState = {
    type: TypeEnum.WorldState,
    randomSeed: Random.getSeed(),
    randomIndex: Random.getIndex(),
    mapWidth: world.Map.Width,
    mapHeight: world.Map.Height,
    mapFriction: world.Map.Friction,
    mapId: 0,
    mapWallStrength: world.Map.wallStrength,
    timestamp: Timer.now(),
    fighters: [],
    projectiles: [],
  };

  for (let i = 0; i < world.Fighters.length; i++) {
    result.fighters.push(encodeEntity(world.Fighters[i]));
  }
  for (let i = 0; i < world.Bullets.length; i++) {
    result.projectiles.push(encodeEntity(world.Bullets[i]));
  }

  return result;
}

export { encodeWorldState as default };