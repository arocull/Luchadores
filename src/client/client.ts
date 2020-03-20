// import * as _ from 'lodash';
import * as socketIo from 'socket.io-client';

import Vector from '../common/engine/Vector';

import Fighter from '../common/engine/Fighter';
import Sheep from '../common/engine/fighters/Sheep';

import Animator from './animation/Animator';

import Projectile from '../common/engine/projectiles/Projectile';

import Particle from './particles/Particle';
// import PLightning from './particles/Lightning';
import PRosePetal from './particles/RosePetal';
import PSmashEffect from './particles/SmashEffect';

import Map from '../common/engine/Map';
import Physics from '../common/engine/Physics';

import Camera from './Camera';
import Renderer from './Render';

// Get rendering viewport--browser only
const viewport = <HTMLCanvasElement>document.getElementById('render');
const canvas = viewport.getContext('2d');

// Create objects for basic testing
const cam = new Camera(viewport.width, viewport.height, 17, 17 / 2);
const map = new Map(50, 50, 10, 'Maps/Arena.png');

const player = new Sheep(1, new Vector(25, 25, 0));
const fighters: Fighter[] = [player];
const animators: Animator[] = [];
const projectiles: Projectile[] = [];
const particles: Particle[] = [];

let HoldingTab: boolean = false;


// Call for client to interpret packet data about specific fighters (reads off object version of Fighter.ToPacket())
function UpdateFighter(packet: any) {
  let newFighter: Fighter = null;

  for (let i = 0; i < fighters.length; i++) {
    if (fighters[i].ID === packet.id) {
      newFighter = fighters[i];
      break;
    }
  }

  if (!newFighter) { // If the fighter could not be found, generate a new one
    if (packet.c === 'Sheep') newFighter = new Sheep(packet.id, new Vector(packet.p[0], packet.p[1], packet.p[2]));

    if (!newFighter) return; // If we could not create a fighter for this class, then ignore this packet
    if (newFighter) fighters.push(newFighter); // Otherwise, add thme to the list (ESLint won't let me do an else statement lol)
  } else newFighter.Position = new Vector(packet.p[0], packet.p[1], packet.p[2]);

  newFighter.Velocity = new Vector(packet.v[0], packet.v[1], packet.v[2]);
  newFighter.Acceleration = new Vector(packet.a[0], packet.a[1], packet.a[2]);
}
// Example on how to use it
UpdateFighter(JSON.parse('{"id":2,"c":"Sheep","p":[30,30,1],"v":[0,-5,0],"a":[0,0,0]}'));


// Call when server says a fighter died, hand it player ID's
function OnDeath(died: number, killer: number) {
  for (let i = 0; i < fighters.length; i++) {
    if (fighters[i].ID === died) {
      PRosePetal.Burst(particles, fighters[i].Position, 0.2, 5, 100);
      fighters.splice(i, 1);
      i--;
    } else if (fighters[i].ID === killer) {
      fighters[i].EarnKill();
    }
  }
}


document.addEventListener('keydown', (event) => {
  if (event.key === 'a') player.Acceleration.x = -20;
  else if (event.key === 'd') player.Acceleration.x = 20;
  else if (event.key === 'w') player.Acceleration.y = 20;
  else if (event.key === 's') player.Acceleration.y = -20;
  else if (event.key === ' ') player.Velocity.z = 10;
  else if (event.key === 'y') HoldingTab = true;
});
document.addEventListener('keyup', (event) => {
  if (event.key === 'a' || event.key === 'd') player.Acceleration.x = 0;
  else if (event.key === 'w' || event.key === 's') player.Acceleration.y = 0;
  else if (event.key === 'y') HoldingTab = false;
});


let LastFrame = 0;
function DoFrame(tick: number) {
  // Convert milliseconds to seconds
  const DeltaTime = (tick / 1000) - LastFrame;
  LastFrame = tick / 1000;

  // Tick physics
  Physics.Tick(DeltaTime, fighters, projectiles, map);

  // Update Camera
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;
  cam.Scale(viewport.width, viewport.height);
  if (player) cam.SetFocus(player);
  cam.UpdateFocus(DeltaTime);


  // Tick animators, prune and generate new ones based off of need
  for (let i = 0; i < fighters.length; i++) {
    // Prune animators who are not being used or have the wrong owner in this location
    if (animators[i] && (!animators[i].GetOwner() || animators[i].GetOwner() !== fighters[i])) animators[i] = null;
    // Add in new animators to fighters lacking them
    if (!animators[i]) animators[i] = new Animator(fighters[i]);
    // Tick existing animators
    if (animators[i]) animators[i].Tick(DeltaTime);
  }
  if (animators.length > fighters.length) animators.splice(fighters.length, animators.length - fighters.length);

  // Tick and prune particles
  for (let i = 0; i < particles.length; i++) {
    particles[i].Tick(DeltaTime);

    if (particles[i].Finished === true) {
      particles.splice(i, 1);
      i--;
    }
  }

  for (let i = 0; i < fighters.length; i++) {
    // eslint-disable-next-line
    // console.log("Fighters ", i, " with HP ", fighters[i].HP, " and Momentum ", fighters[i].Velocity.length()*fighters[i].Mass);
    if (fighters[i].JustHitMomentum > 0) {
      for (let j = 0; j < 3; j++) {
        particles.push(new PSmashEffect(fighters[i].JustHitPosition, fighters[i].JustHitMomentum / 5000));
      }

      if (Vector.Distance(fighters[i].Position, player.Position) <= 2) {
        cam.Shake += fighters[i].JustHitMomentum / 1000;
      }

      fighters[i].JustHitMomentum = 0;
    }

    // Normally shouldn't do this on client incase client simulates a kill but it does not occur on server
    // Currently here for visuals and testing, however
    if (fighters[i].HP <= 0) {
      OnDeath(fighters[i].ID, fighters[i].LastHitBy);
      i--;
    }
  }


  Renderer.DrawScreen(canvas, cam, map, fighters, animators, projectiles, particles);

  if (HoldingTab) Renderer.DrawPlayerList(canvas, cam, 'PING IS LIKE 60');

  return window.requestAnimationFrame(DoFrame);
}

(function setup() {
  window.requestAnimationFrame(DoFrame);

  // TODO: Use connection
  socketIo.connect();
}());