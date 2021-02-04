import AssetPreloader from './AssetPreloader';
import SoundManager from './audio/SoundManager';
import ClientState from './ClientState';
import ClientGraphics from './ClientGraphics';
// Load screen imports
import { UILoadScreen } from './ui';
import Camera from './Camera';
import Render from './Render';

let client: ClientState;
let graphics: ClientGraphics;

const viewport = <HTMLCanvasElement>document.getElementById('render');
const canvas = viewport.getContext('2d');

const uiLoadScreen = new UILoadScreen();

let lastFrame = 0;
function AnimationFrame(tick: number) {
  const DeltaTime = (tick / 1000) - lastFrame;
  lastFrame = tick / 1000;

  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;

  if (client) client.tick(DeltaTime);
  if (graphics) graphics.tick(DeltaTime);

  return window.requestAnimationFrame(AnimationFrame);
}

(function setup() {
  console.log('Preloading assets ...');
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;

  Render.setContext(canvas);

  const tempCam = new Camera(viewport.width, viewport.height, 1, 1);
  tempCam.Scale(viewport.width, viewport.height);
  for (let i = 0; i < uiLoadScreen.frames.length; i++) {
    Render.DrawUIFrame(tempCam, uiLoadScreen.frames[i]);
  }

  AssetPreloader.on('progress', (status) => {
    console.log(`Preload progress: ${Math.round(status.progress * 100)}% ... (${status.file})`);

    viewport.width = window.innerWidth;
    viewport.height = window.innerHeight;
    tempCam.Scale(viewport.width, viewport.height);

    uiLoadScreen.update(status.progress);
    for (let i = 0; i < uiLoadScreen.frames.length; i++) {
      Render.DrawUIFrame(tempCam, uiLoadScreen.frames[i]);
    }
  });

  // TODO: Generate asset list at compile time and return them here
  AssetPreloader.getImages([
    'Interface/Logo.png',
    'Interface/Gear.png',
    'Maps/Arena.jpg',
    'Maps/Grass.jpg',
    'Portraits/Sheep.png',
    'Portraits/Deer.png',
    'Portraits/Flamingo.png',
    'Sprites/Sheep.png',
    'Sprites/Deer.png',
    'Sprites/Flamingo.png',
    'Sprites/Barrel.png',
  ]).then(() => {
    client = new ClientState(window.location.host, true);
    graphics = new ClientGraphics(client);
    SoundManager.initialize(); // Start load in of audio (should move later)
    console.log('Asset preloading complete. Initializing clients.');
    window.requestAnimationFrame(AnimationFrame);
  });
}());