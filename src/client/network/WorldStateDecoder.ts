/* eslint-disable object-curly-newline */
import Vector from '../../common/engine/Vector';
import Random from '../../common/engine/Random';
import World from '../../common/engine/World';
import { Fighter, Sheep, Deer, Flamingo } from '../../common/engine/fighters/index';
import { Projectile, BBullet, BFire } from '../../common/engine/projectiles/index';
import { FighterType, ProjectileType } from '../../common/engine/Enums';
import { IWorldState, IEntityFighter, IEntityProjectile } from '../../common/events/events';
/* eslint-enable object-curly-newline */


/**
 * @function updateFighter
 * @summary Takes a Fighter packet and world, and applies the packet to the corresponding Fighter, or generates one
 * @param world World to apply packet to
 * @param packet Fighter data packet
 * @returns {Fighter} Returns true if a new fighter was generated
 */
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

/**
 * @function generateProjectile
 * @param world World to apply packet to
 * @param packet Projectile data packet
 * @returns {Projectile} New projectile based off of packet data
 */
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


// Decode world-state--hand it a WorldState event and then a world instance to apply the changes to
/* eslint-disable no-param-reassign */
function decodeWorldState(state: IWorldState, world: World) {
  Random.setSeed(state.randomSeed);
  Random.setIndex(state.randomIndex);

  for (let i = 0; i < state.fighters.length; i++) {
    updateFighter(world, state.fighters[i] as IEntityFighter);
  }

  world.Bullets = []; // Clear bullet state and sync with new one
  for (let i = 0; i < state.projectiles.length; i++) {
    world.Bullets.push(generateProjectile(world, state.projectiles[i] as IEntityProjectile));
  }
}
/* eslint-enable no-param-reassign */

export { decodeWorldState as default };