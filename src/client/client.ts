// import * as _ from 'lodash';

import Vector from '../common/engine/Vector';

import Fighter from '../common/engine/Fighter';
import Sheep from '../common/engine/fighters/Sheep';

import Particle from '../common/engine/Particle';
// import PLightning from '../common/engine/particles/Lightning';

import Map from '../common/engine/Map';
import Physics from '../common/engine/Physics';

import Camera from '../common/engine/Camera';
import Renderer from '../common/engine/Render';

// Get rendering viewport--browser only
const viewport = <HTMLCanvasElement>document.getElementById('render');
const canvas = viewport.getContext('2d');

// Create objects for basic testing
const cam = new Camera(viewport.width, viewport.height, 20, 15);
const map = new Map(50, 50, 10);

const player = new Sheep(1, new Vector(25, 25, 0));
// eslint-disable-next-line
let fighters: Fighter[] = [player, new Sheep(2, new Vector(28, 28, 0))];
// eslint-disable-next-line
let particles: Particle[] = [];

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

  Physics.Tick(DeltaTime, fighters, map);

  if (player) cam.SetFocus(player);

  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;
  cam.Width = viewport.width;
  cam.Height = viewport.height;

  for (let i = 0; i < particles.length; i++) {
    particles[i].Tick(DeltaTime);

    if (particles[i].Finished === true) {
      particles.splice(i, 1);
      i--;
    }
  }

  cam.UpdateFocus();
  Renderer.DrawScreen(canvas, cam, map, fighters, particles);

  // Particle testing
  // particles.push(new PLightning(0.5, new Vector(25, 25, 0), new Vector(30, 30, 0)));

  return window.requestAnimationFrame(DoFrame);
}


function Setup() {
  window.requestAnimationFrame(DoFrame);
}
Setup();
