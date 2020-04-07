/* eslint-disable object-curly-newline */
import NetworkClient from './network/client';
import { MessageBus, Topics } from '../common/messaging/bus';
import { TypeEnum } from '../common/events/index';
import { encoder } from '../common/messaging/serde';
import { IWorldState } from '../common/events/events';
import decodeWorldState from './network/WorldStateDecoder';
import Vector from '../common/engine/Vector';
import Random from '../common/engine/Random';
import { Flamingo } from '../common/engine/fighters/index';
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

// Particles
const particles: Particle[] = [];
MessageBus.subscribe('Effect_NewParticle', (msg) => {
  particles.push(msg as Particle);
});


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


// User Input //
const Input = {
  // CLIENTSIDE ONLY
  ListOpen: false, // Opens player list GUI on local client--does not need to be networked

  // FOR REPLICATION (this should be sent to the server for sure)
  MouseDown: false, // Is the player holding their mouse down?
  MouseDirection: new Vector(1, 0, 0), // Where are they aiming?
  Jump: false, // Are they strying to jump?
  MoveDirection: new Vector(0, 0, 0), // Where are they trying to move?
};
// Called when the player's input state changes
function UpdateInput() { // Attempts to send updated user input to server
  MessageBus.publish(Topics.ClientNetworkToServer, encoder({
    type: TypeEnum.PlayerInputState,
    jump: Input.Jump,
    mouseDown: Input.MouseDown,
    mouseDirection: Input.MouseDirection,
    moveDirection: Input.MoveDirection,
  }));
}
document.addEventListener('keydown', (event) => {
  const old = Vector.Clone(Input.MouseDirection);
  const oldJ = Input.Jump;

  if (event.key === 'a') Input.MoveDirection.x = -1;
  else if (event.key === 'd') Input.MoveDirection.x = 1;
  else if (event.key === 'w') Input.MoveDirection.y = 1;
  else if (event.key === 's') Input.MoveDirection.y = -1;
  else if (event.key === ' ') Input.Jump = true;
  else if (event.key === 'y') Input.ListOpen = true;

  if (!old.equals(Input.MouseDirection) || oldJ !== Input.Jump) UpdateInput();
});
document.addEventListener('keyup', (event) => {
  const old = Vector.Clone(Input.MouseDirection);
  const oldJ = Input.Jump;

  if (event.key === 'a' || event.key === 'd') Input.MoveDirection.x = 0;
  else if (event.key === 'w' || event.key === 's') Input.MoveDirection.y = 0;
  else if (event.key === ' ') Input.Jump = false;
  else if (event.key === 'y') Input.ListOpen = false;

  if (!old.equals(Input.MouseDirection) || oldJ !== Input.Jump) UpdateInput();
});
document.addEventListener('mousedown', () => {
  Input.MouseDown = true;
  UpdateInput();
});
document.addEventListener('mouseup', () => {
  Input.MouseDown = false;
  UpdateInput();
});
document.addEventListener('mousemove', (event) => {
  // If the character is present, we should grab mouse location based off of where projectiles are likely to be fired
  if (player && player.isRanged()) {
    const dir = Vector.UnitVectorXY(Vector.Subtract(cam.PositionOffset(player.Position), new Vector(event.clientX, event.clientY, 0)));
    dir.x *= -1;

    Input.MouseDirection = dir;
    UpdateInput(); // We only care to send aim updates if this is a ranged fighter
    // should we only send aim inputs if their mouse is down to help reduce traffic?
  } else {
    Input.MouseDirection = Vector.UnitVectorFromXYZ(event.clientX - (viewport.width / 2), (viewport.height / 2) - event.clientY, 0);
  }
});


let stateUpdatePending = false;
let stateUpdateLastPacketTime = 0;
let stateUpdate: IWorldState = null;
MessageBus.subscribe(Topics.ClientNetworkFromServer, (msg) => {
  if (msg.type === TypeEnum.WorldState) {
    stateUpdatePending = true;
    stateUpdate = msg;
    // Packet timing??
    if (stateUpdateLastPacketTime + 1 > stateUpdateLastPacketTime) { // Would really be if packet.timeSent > stateUpdateLastPacketTime
      stateUpdateLastPacketTime += 1; // = packet.timeSent
    }
  }
});


let LastFrame = 0;
function DoFrame(tick: number) {
  // Convert milliseconds to seconds
  let DeltaTime = (tick / 1000) - LastFrame;
  LastFrame = tick / 1000;

  if (stateUpdatePending && stateUpdate) {
    stateUpdatePending = false;
    decodeWorldState(stateUpdate, world);
    DeltaTime += (Date.now() - stateUpdateLastPacketTime) / 1000; // Do we want to use a more accurate time than this?
  }

  // Use inputs
  // if (dummy) dummy.Jump();
  if (Input.Jump) player.Jump();
  Input.MoveDirection.z = 0;
  player.Move(Input.MoveDirection);
  player.aim(Input.MouseDirection);
  player.Firing = Input.MouseDown;

  world.tick(DeltaTime);

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
      if (a.JustHitMomentum > 700) {
        for (let j = 0; j < 3; j++) {
          particles.push(new PSmashEffect(a.JustHitPosition, a.JustHitMomentum / 5000));
        }

        if (Vector.Distance(a.Position, player.Position) <= 2) {
          cam.Shake += a.JustHitMomentum / 1500;
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