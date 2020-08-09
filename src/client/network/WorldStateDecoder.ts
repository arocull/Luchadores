/* eslint-disable object-curly-newline */
import Vector from '../../common/engine/Vector';
import Random from '../../common/engine/Random';
import World from '../../common/engine/World';
import { Fighter, Sheep, Deer, Flamingo, Soccerball } from '../../common/engine/fighters/index';
import { Projectile, BBullet, BFire } from '../../common/engine/projectiles/index';
import { FighterType, ProjectileType } from '../../common/engine/Enums';
import { IWorldState, IWorldRuleset, IEntityFighter, IEntityProjectile } from '../../common/events/events';
import { Gamemode } from '../../common/engine/gamemode';
/* eslint-enable object-curly-newline */


function updateFighter(world: World, packet: IEntityFighter): Fighter {
  let newFighter: Fighter = null;
  for (let i = 0; i < world.Fighters.length && newFighter === null; i++) {
    if (
      world.Fighters[i].getOwnerID() === packet.ownerId // Ensure they're the right player
      && world.Fighters[i].getCharacter() === packet.class // And the right character
    ) {
      newFighter = world.Fighters[i];
    }
  }

  const pos = new Vector(packet.position.x, packet.position.y, packet.position.z);

  if (newFighter === null) { // If the fighter could not be found, generate a new one
    if (packet.class === FighterType.Sheep) newFighter = new Sheep(packet.ownerId, pos);
    else if (packet.class === FighterType.Deer) newFighter = new Deer(packet.ownerId, pos);
    else if (packet.class === FighterType.Flamingo) newFighter = new Flamingo(packet.ownerId, pos);
    else if (packet.class === FighterType.Soccerball) newFighter = new Soccerball(packet.ownerId, pos);
    else throw new Error(`Unknown fighter type: ${packet.class}`);
    world.Fighters.push(newFighter); // Otherwise, add them to the list
  } else newFighter.Position = pos;

  newFighter.UpdatesMissed = 0; // Reset tracker on fighter so they aren't pruned

  newFighter.Velocity = new Vector(packet.velocity.x, packet.velocity.y, packet.velocity.z);
  newFighter.Acceleration = new Vector(packet.acceleration.x, packet.acceleration.y, packet.acceleration.z);

  newFighter.Firing = packet.attacking;
  newFighter.aim(new Vector(packet.aim.x, packet.aim.y, packet.aim.z));
  newFighter.setBulletCooldown(packet.cooldown);
  newFighter.setSpecialStates(packet.specialNumber, packet.specialBoolean);

  return newFighter;
}


function generateProjectile(world: World, packet: IEntityProjectile): Projectile {
  const pos = new Vector(packet.position.x, packet.position.y, packet.position.z);
  const dir = Vector.UnitVectorFromXYZ(packet.velocity.x, packet.velocity.y, packet.velocity.z);
  let owner: Fighter = null;
  let proj: Projectile = null;

  for (let i = 0; i < world.Fighters.length; i++) {
    if (world.Fighters[i].getOwnerID() === packet.ownerId) {
      owner = world.Fighters[i];
      break;
    }
  }

  if (packet.projectileType === ProjectileType.Bullet) proj = new BBullet(pos, dir, owner);
  else if (packet.projectileType === ProjectileType.Fire) proj = new BFire(pos, dir, owner);

  proj.Velocity = new Vector(packet.velocity.x, packet.velocity.y, packet.velocity.z);
  proj.Acceleration = new Vector(packet.acceleration.x, packet.acceleration.y, packet.acceleration.z);
  proj.setLifetime(packet.lifetime);

  return proj;
}


/* eslint-disable no-param-reassign */
/**
 * @function decodeWorldState
 * @summary Decode world-state--hand it a WorldState event and then a world instance to apply the changes to
 * @param {IWorldState} state WorldState event to decode
 * @param {World} world World to apply WorldState event to
 */
function decodeWorldState(state: IWorldState, world: World) {
  Random.setSeed(state.randomSeed);
  Random.setIndex(state.randomIndex);

  world.timer = state.timer;
  world.phase = state.phase;

  for (let i = 0; i < state.fighters.length; i++) {
    updateFighter(world, state.fighters[i] as IEntityFighter);
  }

  world.Bullets = []; // Clear bullet state and sync with new one
  for (let i = 0; i < state.projectiles.length; i++) {
    world.Bullets.push(generateProjectile(world, state.projectiles[i] as IEntityProjectile));
  }
}
/* eslint-enable no-param-reassign */

/**
 * @function decodeWorldRuleset
 * @summary Generates a new world with a given map and ruleset applied
 * @param {IWorldRuleset} state WorldRuleset event to decode
 * @returns {World} Returns a newly generated world
 */
function decodeWorldRuleset(state: IWorldRuleset): World {
  const world = new World(state.mapId, state.loadProps, true);
  world.Map.Width = state.mapWidth;
  world.Map.Height = state.mapHeight;
  world.Map.Friction = state.mapFriction;
  world.Map.wallStrength = state.mapWallStrength;

  world.applyRuleset(new Gamemode(
    state.name,
    state.descript,
    state.winScore,
    state.teams,
    state.scoreMethod,
    state.permadeath,
    0,
    0,
  ));
  return world;
}

export { decodeWorldState, decodeWorldRuleset };