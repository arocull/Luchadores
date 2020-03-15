// import * as _ from 'lodash';
import * as socketIo from 'socket.io-client';

import Vector from '../common/engine/Vector';

import Fighter from '../common/engine/Fighter';
import Sheep from '../common/engine/fighters/Sheep';

import Animator from './animation/Animator';

import Particle from './particles/Particle';
// import PLightning from './particles/Lightning';
// import PRosePetal from './particles/RosePetal';
import PSmashEffect from './particles/SmashEffect';

import Map from '../common/engine/Map';
import Physics from '../common/engine/Physics';

import Camera from './Camera';
import Renderer from './Render';

// Get rendering viewport--browser only
const viewport = <HTMLCanvasElement>document.getElementById('render');
const canvas = viewport.getContext('2d');

// Create objects for basic testing
const cam = new Camera(viewport.width, viewport.height, 20, 15);
const map = new Map(50, 50, 10, 'Maps/Arena.png');

const player = new Sheep(1, new Vector(25, 25, 0));
const fighters: Fighter[] = [player, new Sheep(2, new Vector(28, 28, 0))];
const animators: Animator[] = [];
const particles: Particle[] = [];

document.addEventListener('keydown', (event) => {
  if (event.key === 'a') player.Acceleration.x = -20;
  else if (event.key === 'd') player.Acceleration.x = 20;
  else if (event.key === 'w') player.Acceleration.y = 20;
  else if (event.key === 's') player.Acceleration.y = -20;
  else if (event.key === ' ') player.Velocity.z = 10;
});
document.addEventListener('keyup', (event) => {
  if (event.key === 'a' || event.key === 'd') player.Acceleration.x = 0;
  else if (event.key === 'w' || event.key === 's') player.Acceleration.y = 0;
});


let LastFrame = 0;
function DoFrame(tick: number) {
  // Convert milliseconds to seconds
  const DeltaTime = (tick / 1000) - LastFrame;
  LastFrame = tick / 1000;

  // Tick physics
  Physics.Tick(DeltaTime, fighters, map);

  // Update Camera
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;
  cam.Width = viewport.width;
  cam.Height = viewport.height;
  if (player) cam.SetFocus(player);
  cam.UpdateFocus();


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
    console.log("Fighters ", i, " with HP ", fighters[i].HP, " and Momentum ", fighters[i].Velocity.length()*fighters[i].Mass);
    if (fighters[i].JustHitMomentum > 0) {
      for (let j = 0; j < 3; j++) {
        particles.push(new PSmashEffect(fighters[i].JustHitPosition, fighters[i].JustHitMomentum / 5000));
      }

      fighters[i].JustHitMomentum = 0;
    }
  }


  Renderer.DrawScreen(canvas, cam, map, fighters, animators, particles);

  return window.requestAnimationFrame(DoFrame);
}

(function setup() {
  window.requestAnimationFrame(DoFrame);

  // TODO: Use connection
  socketIo.connect();
}());
