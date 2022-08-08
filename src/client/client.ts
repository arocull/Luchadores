import AssetPreloader from './AssetPreloader';
import SoundManager from './audio/SoundManager';
import ClientState from './ClientState';
import ClientGraphics from './ClientGraphics';
import ClientAudio from './audio/ClientAudio';
// Load screen imports
import { UILoadScreen } from './ui';
import Camera from './Camera';
import Render from './Render';
import Announcer from './audio/Announcer';

let client: ClientState;
let graphics: ClientGraphics;
let announcer: Announcer;

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
  SoundManager.tick(DeltaTime);
  ClientAudio.tick(DeltaTime);
  announcer.tick(DeltaTime);

  return window.requestAnimationFrame(AnimationFrame);
}

(function setup() {
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;

  Render.setContext(canvas);

  const tempCam = new Camera(viewport.width, viewport.height, 1, 1);
  tempCam.Scale(viewport.width, viewport.height);
  for (let i = 0; i < uiLoadScreen.frames.length; i++) {
    Render.DrawUIFrame(tempCam, uiLoadScreen.frames[i]);
  }

  AssetPreloader.on('progress', (status) => {
    viewport.width = window.innerWidth;
    viewport.height = window.innerHeight;
    tempCam.Scale(viewport.width, viewport.height);

    uiLoadScreen.update(status.progress);
    for (let i = 0; i < uiLoadScreen.frames.length; i++) {
      Render.DrawUIFrame(tempCam, uiLoadScreen.frames[i]);
    }
  });

  // TODO: Generate asset list as a prebuild step and return them here
  // TODO: Do same thing with audio
  AssetPreloader.getImages([
    'interface/loading_icon.gif',
    'interface/logo.png',
    'interface/gear.png',
    'Maps/Arena.jpg',
    'Maps/Grass.jpg',
    'Maps/Snowy.jpg',
    'Portraits/Sheep.png',
    'Portraits/Deer.png',
    'Portraits/Flamingo.png',
    'Sprites/Sheep.png',
    'Sprites/Deer.png',
    'Sprites/Flamingo.png',
    'Sprites/Barrel.png',
  ]);

  SoundManager.initialize(); // Start load in of audio (should move later)

  const assetPromises: Promise<any>[] = []
    .concat(AssetPreloader.getImageQueue())
    .concat(AssetPreloader.getAudioQueue());

  Promise.all(assetPromises).then(() => {
    // Initialize client stuff
    client = new ClientState(window.location.host, true);
    graphics = new ClientGraphics(client);
    ClientAudio.setCamera(client.camera);
    announcer = new Announcer(client, graphics.camera);

    // Hide loading screen
    uiLoadScreen.hide();

    console.log('Asset preloading complete. Initializing clients.');
    window.requestAnimationFrame(AnimationFrame);
  });
}());