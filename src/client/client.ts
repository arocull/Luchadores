/* eslint-disable object-curly-newline */
import NetworkClient from './network/client';
import { MessageBus, Topics } from '../common/messaging/bus';
import { TypeEnum, IPlayerDied } from '../common/events/index';
import { encoder } from '../common/messaging/serde';
import { IWorldState, PlayerState } from '../common/events/events';
import decodeWorldState from './network/WorldStateDecoder';
import Vector from '../common/engine/Vector';
import Random from '../common/engine/Random';
import { Particle, PConfetti, PRosePetal, PSmashEffect } from './particles/index';
import { Fighter } from '../common/engine/fighters/index';
import Animator from './animation/Animator';
import Player from '../common/engine/Player';
import World from '../common/engine/World';
import RenderSettings from './RenderSettings';
import Camera from './Camera';
import { UIFrame, UIClassSelect } from './ui/index';
import Renderer from './Render';
import { FighterType } from '../common/engine/Enums';
/* eslint-enable object-curly-newline */

// Set up base client things
let clientID = '';
let username = '';
let luchador: FighterType = FighterType.Sheep;


// Generate World
const world = new World();
Random.randomSeed();

// TODO: HAX - get topics to use from web socket
const topics = {
  ClientNetworkToServer: null as string,
  ClientNetworkFromServer: null as string,
};

// Get rendering viewport--browser only
const viewport = <HTMLCanvasElement>document.getElementById('render');
const canvas = viewport.getContext('2d');

const renderSettings = new RenderSettings(3, 5, true);
renderSettings.FPScounter = true;
const fpsCount: number[] = [];

const cam = new Camera(viewport.width, viewport.height, 18, 12, renderSettings);
cam.SetFocusPosition(new Vector(world.Map.Width / 2, world.Map.Height / 2, 0));

let player: Player = null;
let character: Fighter = null;

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
MessageBus.subscribe(Topics.ClientNetworkFromServer, (msg: IPlayerDied) => {
  if (msg.type !== TypeEnum.PlayerDied) return;
  OnDeath(msg.characterId, msg.killerId);
});


// User Input //
const Input = {
  // CLIENTSIDE ONLY
  GUIMode: true,
  UsernameSelectOpen: false,
  ClassSelectOpen: true,
  PlayerListOpen: false, // Opens player list GUI on local client--does not need to be networked
  MouseX: 0,
  MouseY: 0,
  MouseDownLastFrame: false,

  // FOR REPLICATION (this should be sent to the server for sure)
  MouseDown: false, // Is the player holding their mouse down?
  MouseDirection: new Vector(1, 0, 0), // Where are they aiming?
  Jump: false, // Are they strying to jump?
  MoveDirection: new Vector(0, 0, 0), // Where are they trying to move?
};
// Called when the player's input state changes
function UpdateInput() { // Attempts to send updated user input to server
  if (Input.GUIMode || !character) return; // Do not send input updates if the player is fiddling with UI

  Input.MoveDirection.z = 0; // The player should never have any move or aim input that points upward
  Input.MouseDirection.z = 0;

  MessageBus.publish(Topics.ClientNetworkToServer, encoder({
    type: TypeEnum.PlayerInputState,
    id: clientID,
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
  else if (event.key === 'y') Input.PlayerListOpen = true;

  if (!old.equals(Input.MouseDirection) || oldJ !== Input.Jump) UpdateInput();
});
document.addEventListener('keyup', (event) => {
  const old = Vector.Clone(Input.MouseDirection);
  const oldJ = Input.Jump;

  if (event.key === 'a' || event.key === 'd') Input.MoveDirection.x = 0;
  else if (event.key === 'w' || event.key === 's') Input.MoveDirection.y = 0;
  else if (event.key === ' ') Input.Jump = false;
  else if (event.key === 'y') Input.PlayerListOpen = false;

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
  if (Input.GUIMode) {
    Input.MouseX = event.clientX;
    Input.MouseY = event.clientY;

  // If the character is present, we should grab mouse location based off of where projectiles are likely to be fired
  } else if (character && character.isRanged()) {
    const dir = Vector.UnitVectorXY(Vector.Subtract(cam.PositionOffset(character.Position), new Vector(event.clientX, event.clientY, 0)));
    dir.x *= -1;

    Input.MouseDirection = dir;
    UpdateInput(); // We only care to send aim updates if this is a ranged fighter
    // should we only send aim inputs if their mouse is down to help reduce traffic?
  } else {
    Input.MouseDirection = Vector.UnitVectorFromXYZ(event.clientX - (viewport.width / 2), (viewport.height / 2) - event.clientY, 0);
  }
});


// UI Management
const uiBackdrop = new UIFrame(0, 0, 1, 1, false);
const uiClassSelect = new UIClassSelect(2, 2, 3);
uiBackdrop.alpha = 0.25;
uiBackdrop.renderStyle = '#000000';
function doUIFrameInteraction(frame: UIFrame) {
  const hovering = frame.checkMouse(Input.MouseX / viewport.width, Input.MouseY / viewport.height);
  frame.onHover(hovering);
  if (hovering && !Input.MouseDown && Input.MouseDownLastFrame) frame.onClick();
}
MessageBus.subscribe('PickUsername', (name: string) => {
  username = name;

  if (!player) player = new Player(clientID, username);
});
MessageBus.subscribe('PickCharacter', (type: FighterType) => {
  luchador = type;

  Input.ClassSelectOpen = false;

  /* // Disabled for now until message bus is fixed
  MessageBus.publish(Topics.ClientNetworkToServer, {
    type: TypeEnum.PlayerJoined,
    clientID,
    username,
    luchador,
  });
  */

  character = world.spawnFighter(player, luchador);
});


// State Updates
let stateUpdatePending = false;
let stateUpdateLastPacketTime = 0;
let stateUpdate: IWorldState = null;
MessageBus.subscribe(Topics.ClientNetworkFromServer, (msg: IWorldState) => {
  if (msg.type === TypeEnum.WorldState) {
    stateUpdatePending = true;
    stateUpdate = msg;
    // Packet timing??
    if (stateUpdateLastPacketTime + 1 > stateUpdateLastPacketTime) { // Would really be if packet.timeSent > stateUpdateLastPacketTime
      stateUpdateLastPacketTime += 1; // = packet.timeSent
    }
  }
});
MessageBus.subscribe(Topics.ClientNetworkFromServer, (msg: PlayerState) => {
  if (msg.type === TypeEnum.PlayerState) {
    const mismatch = msg.characterID !== player.getCharacterID();
    if (mismatch && character) { // If there is a character ID mismatch, then we should remove current character
      character.HP = 0;
      character.LastHitBy = null;
    }

    player.assignCharacterID(msg.characterID);

    if (mismatch && character) { // If there was a mismatch and old character was killed, generate a new one
      MessageBus.publish('PickCharacter', luchador);
    }

    character.HP = msg.health;
  }
});


let LastFrame = 0;
function DoFrame(tick: number) {
  // Convert milliseconds to seconds
  let DeltaTime = (tick / 1000) - LastFrame;
  LastFrame = tick / 1000;

  Input.GUIMode = (Input.ClassSelectOpen || Input.UsernameSelectOpen || Input.PlayerListOpen);

  if (stateUpdatePending && stateUpdate) {
    stateUpdatePending = false;
    decodeWorldState(stateUpdate, world);
    DeltaTime += (Date.now() - stateUpdateLastPacketTime) / 1000; // Do we want to use a more accurate time than this?
    // eslint-disable-next-line
    console.log('Applied world state update with DeltaTime', DeltaTime);
  }

  // Use inputs
  if (character) {
    if (Input.Jump) character.Jump();
    character.Move(Input.MoveDirection);
    character.aim(Input.MouseDirection);
    character.Firing = Input.MouseDown;

    cam.SetFocus(character);
  }

  world.tick(DeltaTime);

  // Update Camera
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;
  cam.Scale(viewport.width, viewport.height);
  cam.UpdateFocus(DeltaTime);

  // Apply visual effects
  for (let i = 0; i < world.Fighters.length; i++) {
    const a = world.Fighters[i];
    if (a) {
      // Tick animators, prune and generate new ones based off of need
      if (!a.Animator) a.Animator = new Animator(a, renderSettings);
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

        if (Vector.Distance(a.Position, character.Position) <= 2) {
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
  if (character) cam.Shake += character.BulletShock;

  // Tick and prune particles
  for (let i = 0; i < particles.length; i++) {
    particles[i].Tick(DeltaTime);

    if (particles[i].Finished === true) {
      particles.splice(i, 1);
      i--;
    }
  }

  Renderer.DrawScreen(canvas, cam, world.Map, world.Fighters, world.Bullets, particles);

  if (Input.GUIMode) Renderer.DrawUIFrame(canvas, cam, uiBackdrop);
  if (Input.ClassSelectOpen) {
    for (let i = 0; i < uiClassSelect.frames.length; i++) {
      doUIFrameInteraction(uiClassSelect.frames[i]);
      Renderer.DrawUIFrame(canvas, cam, uiClassSelect.frames[i]);
    }
  }
  if (Input.PlayerListOpen) Renderer.DrawPlayerList(canvas, cam, 'PING IS LIKE 60');

  if (renderSettings.FPScounter) {
    if (fpsCount.length >= 30) fpsCount.shift();
    fpsCount.push(DeltaTime);

    let avgDT = 0;
    for (let i = 0; i < fpsCount.length; i++) {
      avgDT += fpsCount[i];
    }
    avgDT /= fpsCount.length;

    Renderer.DrawFPS(canvas, cam, avgDT);
  }

  Input.MouseDownLastFrame = Input.MouseDown;

  return window.requestAnimationFrame(DoFrame);
}


// Currently, just go ahead and give the player a username and character to start with until server is hooked up
MessageBus.publish('PickUsername', 'player1');


/* eslint-disable no-console */
(function setup() {
  window.requestAnimationFrame(DoFrame);

  const wsUrl = `ws://${window.location.host}/socket`;
  console.log('Attempting WebSocket at URL', wsUrl);

  const ws = new NetworkClient(`ws://${window.location.host}/socket`);
  ws.connect()
    .then(() => {
      topics.ClientNetworkFromServer = ws.topicClientFromServer;
      topics.ClientNetworkToServer = ws.topicClientToServer;
      console.log('Connected OK! Configured topics:', topics);
    })
    .catch((err) => console.error('Failed to connect!', err))
    .finally(() => console.log('... and finally!'));

  clientID = ws.getId();
}());
/* eslint-enable no-console */
