/* eslint-disable object-curly-newline */
import NetworkClient from './network/client';
import Vector from '../common/engine/Vector';
import Random from '../common/engine/Random';
import { Fighter, Sheep, Deer, Flamingo } from '../common/engine/fighters/index';
import { Particle, PConfetti, PRosePetal, PSmashEffect } from './particles/index';
import Animator from './animation/Animator';
import World from '../common/engine/World';
import RenderSettings from './RenderSettings';
import Camera from './Camera';
import Renderer from './Render';
/* eslint-enable object-curly-newline */


// Generate World
const world = new World();
Random.randomSeed();


// Get rendering viewport--browser only
const viewport = <HTMLCanvasElement>document.getElementById('render');
const canvas = viewport.getContext('2d');
const renderSettings = new RenderSettings(3, 5, true);
const cam = new Camera(viewport.width, viewport.height, 18, 12, renderSettings);

const player = new Flamingo(1, new Vector(25, 25, 0));
world.Fighters.push(player);
const particles: Particle[] = [];

const Input = {
  ListOpen: false, // Opens player list GUI on local client--does not need to be networked
  MouseDown: false, // Is the player holding their mouse down?
  MouseDirection: new Vector(0, 0, 0), // Where are they aiming?
  Jump: false, // Are they strying to jump?
  MoveDirection: new Vector(0, 0, 0), // Where are they trying to move?
};


// Call for client to interpret packet data about specific fighters (reads off object version of Fighter.ToPacket())
type VectorXYZ = [number, number, number];

interface Packet {
  id: number;
  c: string;
  p: VectorXYZ;
  v: VectorXYZ;
  a: VectorXYZ;
}

function UpdateFighter(packet: Packet) {
  let newFighter: Fighter = null;
  for (let i = 0; i < world.Fighters.length && newFighter === null; i++) {
    if (world.Fighters[i].getOwnerID() === packet.id) newFighter = world.Fighters[i];
  }

  if (!newFighter) { // If the fighter could not be found, generate a new one
    if (packet.c === 'Sheep') {
      newFighter = new Sheep(packet.id, new Vector(packet.p[0], packet.p[1], packet.p[2]));
    } else if (packet.c === 'Deer') {
      newFighter = new Deer(packet.id, new Vector(packet.p[0], packet.p[1], packet.p[2]));
    } else if (packet.c === 'Flamingo') {
      newFighter = new Flamingo(packet.id, new Vector(packet.p[0], packet.p[1], packet.p[2]));
    } else {
      throw new Error(`Unknown fighter type: ${packet.c}`);
    }
    world.Fighters.push(newFighter); // Otherwise, add them to the list
  } else {
    newFighter.Position = new Vector(packet.p[0], packet.p[1], packet.p[2]);
  }

  newFighter.Velocity = new Vector(packet.v[0], packet.v[1], packet.v[2]);
  newFighter.Acceleration = new Vector(packet.a[0], packet.a[1], packet.a[2]);
}
// Example on how to use it
UpdateFighter(JSON.parse('{"id":2,"c":"Sheep","p":[30,30,1],"v":[0,-5,0],"a":[0,0,0]}'));


// Call when server says a fighter died, hand it player ID's
function OnDeath(died: number, killer: number) {
  for (let i = 0; i < world.Fighters.length; i++) {
    if (world.Fighters[i].getOwnerID() === died) {
      PConfetti.Burst(particles, world.Fighters[i].Position, 0.2, 4, 50 * renderSettings.ParticleAmount);
      world.Fighters.splice(i, 1);
      i--;
    } else if (world.Fighters[i].getOwnerID() === killer) {
      world.Fighters[i].EarnKill();
      if (world.Fighters[i].Animator) world.Fighters[i].Animator.killEffectCountdown = 3;
    }
  }
}


document.addEventListener('keydown', (event) => {
  if (event.key === 'a') Input.MoveDirection.x = -1;
  else if (event.key === 'd') Input.MoveDirection.x = 1;
  else if (event.key === 'w') Input.MoveDirection.y = 1;
  else if (event.key === 's') Input.MoveDirection.y = -1;
  else if (event.key === ' ') Input.Jump = true;
  else if (event.key === 'y') Input.ListOpen = true;
});
document.addEventListener('keyup', (event) => {
  if (event.key === 'a' || event.key === 'd') Input.MoveDirection.x = 0;
  else if (event.key === 'w' || event.key === 's') Input.MoveDirection.y = 0;
  else if (event.key === ' ') Input.Jump = false;
  else if (event.key === 'y') Input.ListOpen = false;
});
document.addEventListener('mousedown', () => {
  Input.MouseDown = true;
});
document.addEventListener('mouseup', () => {
  Input.MouseDown = false;
});
document.addEventListener('mousemove', (event) => {
  // If the character is present, we should grab mouse location based off of where projectiles are likely to be fired
  if (player && player.isRanged()) {
    const dir = Vector.UnitVectorXY(Vector.Subtract(cam.PositionOffset(player.Position), new Vector(event.clientX, event.clientY, 0)));
    dir.x *= -1;

    Input.MouseDirection = dir;
  } else {
    Input.MouseDirection = Vector.UnitVectorFromXYZ(event.clientX - (viewport.width / 2), (viewport.height / 2) - event.clientY, 0);
  }
});


let LastFrame = 0;
function DoFrame(tick: number) {
  // Convert milliseconds to seconds
  const DeltaTime = (tick / 1000) - LastFrame;
  LastFrame = tick / 1000;

  // Use inputs
  if (Input.Jump) player.Jump();
  Input.MoveDirection.z = 0;
  player.Move(Input.MoveDirection);
  player.aim(Input.MouseDirection);
  player.Firing = Input.MouseDown;

  world.doUpdates(DeltaTime);

  // Tick physics
  world.TickPhysics(DeltaTime);

  // Update Camera
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;
  cam.Scale(viewport.width, viewport.height);
  if (player) cam.SetFocus(player);
  cam.UpdateFocus(DeltaTime);

  // Apply visual effects
  for (let i = 0; i < world.Fighters.length; i++) {
    const a = world.Fighters[i];
    if (a) {
      // Tick animators, prune and generate new ones based off of need
      if (!a.Animator) a.Animator = new Animator(a);
      else if (a.Animator) {
        a.Animator.Tick(DeltaTime);
        if (a.Animator.killEffectCountdown === 0) {
          PRosePetal.Burst(particles, a.Position, 0.2, 5, 20 * renderSettings.ParticleAmount);
        }
      }

      // Collision effects
      if (a.JustHitMomentum > 0) {
        for (let j = 0; j < 3; j++) {
          particles.push(new PSmashEffect(a.JustHitPosition, a.JustHitMomentum / 5000));
        }

        if (Vector.Distance(a.Position, player.Position) <= 2) {
          cam.Shake += a.JustHitMomentum / 1000;
        }

        a.JustHitMomentum = 0;
      }

      // Normally shouldn't do this on client incase client simulates a kill but it does not occur on server
      // Currently here for visuals and testing, however
      if (a.HP <= 0) {
        OnDeath(a.getOwnerID(), a.LastHitBy);
        i--;
      }
    }
  }
  cam.Shake += player.BulletShock;

  // Tick and prune particles
  for (let i = 0; i < particles.length; i++) {
    particles[i].Tick(DeltaTime);

    if (particles[i].Finished === true) {
      particles.splice(i, 1);
      i--;
    }
  }

  Renderer.DrawScreen(canvas, cam, world.Map, world.Fighters, world.Bullets, particles);
  if (Input.ListOpen) Renderer.DrawPlayerList(canvas, cam, 'PING IS LIKE 60');

  return window.requestAnimationFrame(DoFrame);
}

/* eslint-disable no-console */
(function setup() {
  window.requestAnimationFrame(DoFrame);

  const wsUrl = `ws://${window.location.host}/socket`;
  console.log('Attempting WebSocket at URL', wsUrl);

  const ws = new NetworkClient(`ws://${window.location.host}/socket`);
  ws.connect()
    .then(() => console.log('Connected OK!'))
    .catch((err) => console.error('Failed to connect!', err))
    .finally(() => console.log('... and finally!'));
}());
/* eslint-enable no-console */