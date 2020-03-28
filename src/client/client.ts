// import * as _ from 'lodash';
import NetworkClient from './network/client';
import Vector from '../common/engine/Vector';
import Fighter from '../common/engine/Fighter';
import Sheep from '../common/engine/fighters/Sheep';
import Deer from '../common/engine/fighters/Deer';
import Animator from './animation/Animator';
import Particle from './particles/Particle';
import PConfetti from './particles/Confetti';
import PRosePetal from './particles/RosePetal';
import PSmashEffect from './particles/SmashEffect';
import World from '../common/engine/World';
import RenderSettings from './RenderSettings';
import Camera from './Camera';
import Renderer from './Render';


// Generate World
const world = new World();


// Get rendering viewport--browser only
const viewport = <HTMLCanvasElement>document.getElementById('render');
const canvas = viewport.getContext('2d');
const renderSettings = new RenderSettings(3, 5, true);
const cam = new Camera(viewport.width, viewport.height, 18, 12, renderSettings);

const player = new Deer(1, new Vector(25, 25, 0));
world.Fighters.push(player);
const particles: Particle[] = [];

const Input = {
  ListOpen: false,
  MouseDown: false,
  MouseDirection: new Vector(0, 0, 0),
  Jump: false,
  MoveDirection: new Vector(0, 0, 0),
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
  for (let i = 0; i < world.Fighters.length; i++) {
    if (world.Fighters[i].ID === packet.id) {
      newFighter = world.Fighters[i];
      break;
    }
  }

  if (!newFighter) { // If the fighter could not be found, generate a new one
    if (packet.c === 'Sheep') {
      newFighter = new Sheep(packet.id, new Vector(packet.p[0], packet.p[1], packet.p[2]));
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
    if (world.Fighters[i].ID === died) {
      PConfetti.Burst(particles, world.Fighters[i].Position, 0.2, 4, 50 * renderSettings.ParticleAmount);
      world.Fighters.splice(i, 1);
      i--;
    } else if (world.Fighters[i].ID === killer) {
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
  Input.MouseDirection = Vector.UnitVectorFromXYZ(event.clientX - (viewport.width / 2), (viewport.height / 2) - event.clientY, 0);
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
  player.Click(Input.MouseDirection);
  player.Firing = Input.MouseDown;

  world.DoUpdates(DeltaTime);

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
        OnDeath(a.ID, a.LastHitBy);
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