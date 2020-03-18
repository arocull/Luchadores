// import * as _ from 'lodash';
import * as events from '../common/events/events';

import Vector from '../common/engine/Vector';

import Fighter from '../common/engine/Fighter';
import Sheep from '../common/engine/fighters/Sheep';

import Animator from './animation/Animator';

import Particle from './particles/Particle';
// import PLightning from './particles/Lightning';
// import PRosePetal from './particles/RosePetal';

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

  // Update Camera
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;
  cam.Width = viewport.width;
  cam.Height = viewport.height;
  if (player) cam.SetFocus(player);
  cam.UpdateFocus();

  Renderer.DrawScreen(canvas, cam, map, fighters, animators, particles);

  // Particle testing
  /* for (let i = 0; i < 3; i++) {
    particles.push(new PRosePetal(player.Position, 0.2, 5));
  } */

  return window.requestAnimationFrame(DoFrame);
}

(function setup() {
  window.requestAnimationFrame(DoFrame);

  // TODO: Implement proper client library, reconnect, durability, etc.
  const wsUrl = `ws://${window.location.host}/socket`;
  console.log('Attempting WebSocket at URL', wsUrl);

  const ws = new WebSocket(wsUrl);
  ws.binaryType = 'arraybuffer'; // Force binary type to `arraybuffer` instead of `Blob`

  console.info('New websocket connection:', [ws.binaryType, ws.protocol]);
  ws.addEventListener('open', (/* event */) => {
    const request = events.core.Envelope.encode({
      type: events.core.TypeEnum.LobbyRequest,
      data: events.lobby.LobbyRequest.encode(events.lobby.LobbyRequest.create({ search: 'hello' })).finish(),
    }).finish();
    console.log('Sending Envelope->LobbyRequest', request);
    ws.send(request);
  });
  ws.addEventListener('message', (msgEvent) => {
    console.log('Receiving Envelope', new Uint8Array(msgEvent.data));
    const envelope = events.core.Envelope.decode(new Uint8Array(msgEvent.data));
    console.log('Envelope decoded', envelope);

    let response: events.lobby.LobbyResponse;
    switch (envelope.type) {
      case events.core.TypeEnum.LobbyResponse:
        console.log('envelope.data', envelope.data);
        response = events.lobby.LobbyResponse.decode(envelope.data);
        break;
      // TODO: Add missing types
      default:
        throw new Error(`Unexpected Envelope.TypeEnum: ${envelope.type}`);
    }
    console.log('LobbyResponse decoded', response);
    console.log('response instanceof events.LobbyResponse',
      response instanceof events.lobby.LobbyResponse);
  });
  ws.addEventListener('close', (closeEvent) => {
    console.log('WebSocket closing', closeEvent);
    console.log('Code / Reason', closeEvent.code, closeEvent.reason);
  });
  ws.addEventListener('error', (event) => {
    console.error('WebSocket error', event);
  });
}());
