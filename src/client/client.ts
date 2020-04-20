/* eslint-disable object-curly-newline */
import _ from 'lodash';
import NetworkClient from './network/client';
import { MessageBus } from '../common/messaging/bus';
import { decodeInt64 } from '../common/messaging/serde';
import { IEvent, TypeEnum } from '../common/events/index';
import { IPlayerConnect, IPlayerState, IWorldState } from '../common/events/events';
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
import { UIFrame, UIClassSelect, UIUsernameSelect, UIHealthbar, UITextBox } from './ui/index';
import Renderer from './Render';
import { FighterType } from '../common/engine/Enums';
import { now } from '../common/engine/Time';
import { PingInfo } from '../common/network/pingpong';
/* eslint-enable object-curly-newline */

// Set up base client things
const player = new Player('');
// eslint-disable-next-line
let luchador: FighterType = FighterType.Sheep;
let character: Fighter = null;
let respawnTimer = 3;

// Generate World
const world = new World();
world.Map.loadTexture();
Random.randomSeed();

let playerConnects: IPlayerConnect[] = [];

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

const uiBackdrop = new UIFrame(0, 0, 1, 1, false);
const uiClassSelect = new UIClassSelect(2, 2, 3);
const uiUsernameSelect = new UIUsernameSelect();
const uiHealthbar = new UIHealthbar();
const uiKillCam = new UITextBox(0, 0.9, 1, 0.1, false, '');


// Particles
const particles: Particle[] = [];
MessageBus.subscribe('Effect_NewParticle', (msg) => {
  particles.push(msg as Particle);
});


// Call when server says a fighter died, hand it player ID's
function OnDeath(died: number, killer: number) {
  let killFighter: Fighter = null;

  for (let i = 0; i < world.Fighters.length; i++) {
    if (world.Fighters[i].getOwnerID() === died) {
      PConfetti.Burst(particles, world.Fighters[i].Position, 0.2, 4, 50 * renderSettings.ParticleAmount);
      world.Fighters.splice(i, 1);
      i--;
    } else if (world.Fighters[i].getOwnerID() === killer) {
      world.Fighters[i].EarnKill();
      killFighter = world.Fighters[i];
      if (world.Fighters[i].Animator) world.Fighters[i].Animator.killEffectCountdown = 3;
    }
  }

  if (died === player.getCharacterID()) { // Set camera focus to your killer as a killcam until you respawn
    character = null;
    uiHealthbar.collapse();
    cam.SetFocus(killFighter);
    uiKillCam.text = `Killed by ${killFighter.DisplayName}`;
  }
}


// User Input //
const Input = {
  // CLIENTSIDE ONLY
  GUIMode: false,
  UsernameSelectOpen: true,
  ClassSelectOpen: false,
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

  MessageBus.publish(topics.ClientNetworkToServer, {
    type: TypeEnum.PlayerInputState,
    jump: Input.Jump,
    mouseDown: Input.MouseDown,
    mouseDirection: Input.MouseDirection,
    moveDirection: Input.MoveDirection,
  });
}
document.addEventListener('keydown', (event) => {
  const old = Vector.Clone(Input.MoveDirection);
  const oldJ = Input.Jump;

  if (Input.UsernameSelectOpen) { // Type into username textbox
    if (event.key.length === 1) uiUsernameSelect.typeCharacter(event.key);
    else if (event.key === 'Backspace') uiUsernameSelect.backspace();
    else if (event.key === 'Enter') uiUsernameSelect.enter();
  }
  if (event.shiftKey) {
    uiUsernameSelect.shift(true);
  }

  if (event.key === 'a') Input.MoveDirection.x = -1;
  else if (event.key === 'd') Input.MoveDirection.x = 1;
  else if (event.key === 'w') Input.MoveDirection.y = 1;
  else if (event.key === 's') Input.MoveDirection.y = -1;
  else if (event.key === ' ') Input.Jump = true;
  else if (event.key === 'y') Input.PlayerListOpen = true;

  if (!Input.MoveDirection.equals(old) || oldJ !== Input.Jump) UpdateInput();
});
document.addEventListener('keyup', (event) => {
  const old = Vector.Clone(Input.MoveDirection);
  const oldJ = Input.Jump;

  if (event.shiftKey) {
    uiUsernameSelect.shift(false);
  }

  if (event.key === 'a' || event.key === 'd') Input.MoveDirection.x = 0;
  else if (event.key === 'w' || event.key === 's') Input.MoveDirection.y = 0;
  else if (event.key === ' ') Input.Jump = false;
  else if (event.key === 'y') Input.PlayerListOpen = false;

  if (!Input.MoveDirection.equals(old) || oldJ !== Input.Jump) UpdateInput();
});
document.addEventListener('mousedown', () => {
  Input.MouseDown = true;
  UpdateInput();
});
document.addEventListener('mouseup', () => {
  Input.MouseDown = false;
  UpdateInput();
});

const throttledMouseUpdate = _.throttle((event) => {
  const dir = Vector.UnitVectorXY(Vector.Subtract(cam.PositionOffset(character.Position), new Vector(event.clientX, event.clientY, 0)));
  dir.x *= -1;

  Input.MouseDirection = dir;
  UpdateInput(); // We only care to send aim updates if this is a ranged fighter
}, 100);

document.addEventListener('mousemove', (event) => {
  if (Input.GUIMode) {
    Input.MouseX = event.clientX;
    Input.MouseY = event.clientY;

    // If the character is present, we should grab mouse location based off of where projectiles are likely to be fired
  } else if (character && character.isRanged() && Input.MouseDown) {
    // Throttled the update so we don't strain the server.
    // This is matched locally so there won't be conflicts with the server's physics.
    throttledMouseUpdate(event);
  } else {
    Input.MouseDirection = Vector.UnitVectorFromXYZ(event.clientX - (viewport.width / 2), (viewport.height / 2) - event.clientY, 0);
  }
});


// UI Management
uiBackdrop.alpha = 0.25;
uiBackdrop.renderStyle = '#000000';
uiBackdrop.onClick = (() => {
  uiUsernameSelect.deselect();
});
uiKillCam.alpha = 0;
function doUIFrameInteraction(frame: UIFrame) {
  const hovering = frame.checkMouse(Input.MouseX / viewport.width, Input.MouseY / viewport.height);
  frame.onHover(hovering);
  if (hovering && !Input.MouseDown && Input.MouseDownLastFrame) frame.onClick();
}
MessageBus.subscribe('PickUsername', (name: string) => {
  player.setUsername(name);

  MessageBus.publish(topics.ClientNetworkToServer, <IPlayerConnect>{
    type: TypeEnum.PlayerConnect,
    ownerId: -1, // We don't know this on this client yet - server will decide
    username: name,
  });

  Input.UsernameSelectOpen = false;
  Input.ClassSelectOpen = true;
});
MessageBus.subscribe('PickCharacter', (type: FighterType) => {
  luchador = type;
  respawnTimer = 3;
  Input.ClassSelectOpen = false;

  MessageBus.publish(topics.ClientNetworkToServer, {
    type: TypeEnum.PlayerSpawned,
    fighterClass: type,
  });

  // character = world.spawnFighter(player, luchador);
});


// State Updates
let stateUpdatePending = false;
let stateUpdateLastPacketTime = 0;
let stateUpdate: IWorldState = null;
function UpdatePlayerState(msg: IPlayerState) {
  const mismatch = msg.characterID !== player.getCharacterID();

  player.assignCharacterID(msg.characterID);

  if (mismatch && character) { // If there is a character ID mismatch, then we should remove current character
    character.HP = 0;
    character.LastHitBy = null;

    // character = world.spawnFighter(player, luchador);
  }

  if (character) character.HP = msg.health;
}
// SEE SETUP \/ \/ \/ \/

let networkTimeOffset = 0;
MessageBus.subscribe('ping-info', (pingInfo: PingInfo) => {
  networkTimeOffset = now() - pingInfo.remoteTimestamp;
});

let LastFrame = 0;
function DoFrame(tick: number) {
  // Convert milliseconds to seconds
  const DeltaTime = (tick / 1000) - LastFrame;
  let worldDeltaTime = DeltaTime;
  LastFrame = tick / 1000;

  Input.GUIMode = (Input.ClassSelectOpen || Input.UsernameSelectOpen);

  if (stateUpdatePending && stateUpdate) {
    stateUpdatePending = false;

    for (let i = 0; i < world.Fighters.length; i++) { // Keeps track of how many WorldState updates each fighters missed
      world.Fighters[i].UpdatesMissed++;
    }

    decodeWorldState(stateUpdate, world);

    for (let i = 0; i < world.Fighters.length; i++) {
      // Prune fighters who have not been included in the world state 5 consecutive times
      if (world.Fighters[i].UpdatesMissed > 5) {
        OnDeath(world.Fighters[i].getOwnerID(), -1);
        i--;
      }
    }

    // TODO: Get server time in client-server handshake and use that for time calculations
    worldDeltaTime = ((now() - networkTimeOffset) - stateUpdateLastPacketTime) / 1000;
  }

  // Use inputs
  if (character) {
    if (Input.Jump) character.Jump();
    character.Move(Input.MoveDirection);
    character.aim(Input.MouseDirection);
    character.Firing = Input.MouseDown;

    cam.SetFocus(character);
  }

  world.tick(worldDeltaTime);

  // Update Camera
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;
  cam.Scale(viewport.width, viewport.height);
  cam.UpdateFocus(DeltaTime);

  // Apply visual effects
  for (let i = 0; i < world.Fighters.length; i++) {
    const a = world.Fighters[i];
    if (a) {
      if (a.getOwnerID() === player.getCharacterID()) character = a;

      // Tick animators, prune and generate new ones based off of need
      if (!a.Animator) a.Animator = new Animator(a, renderSettings);
      else if (a.Animator) {
        a.Animator.Tick(DeltaTime);
        if (a.Animator.killEffectCountdown === 0) {
          PRosePetal.Burst(particles, a.Position, 0.2, 5, 20 * renderSettings.ParticleAmount);
        }
      }

      // Apply any fighter names who do not have names yet
      if (!a.DisplayName) {
        for (let j = 0; j < playerConnects.length; j++) {
          if (playerConnects[j] && playerConnects[j].ownerId === a.getOwnerID()) {
            a.DisplayName = playerConnects[j].username;
            break;
          }
        }
      }

      // Collision effects
      if (a.JustHitMomentum > 700) {
        for (let j = 0; j < 3; j++) {
          particles.push(new PSmashEffect(a.JustHitPosition, a.JustHitMomentum / 5000));
        }

        if (character && Vector.Distance(a.Position, character.Position) <= 2) {
          cam.Shake += a.JustHitMomentum / 1500;
        }

        a.JustHitMomentum = 0;
      }
    }
  }
  if (character) {
    cam.Shake += character.BulletShock;
    respawnTimer = 3;
  } else if (!Input.GUIMode) {
    respawnTimer -= DeltaTime;

    if (respawnTimer <= 0) { // If their respawn timer reached 0, pull up class elect again
      Input.ClassSelectOpen = true;
    }
  }

  // Tick and prune particles
  for (let i = 0; i < particles.length; i++) {
    particles[i].Tick(DeltaTime);

    if (particles[i].Finished === true) {
      particles.splice(i, 1);
      i--;
    }
  }

  Renderer.DrawScreen(canvas, cam, world.Map, world.Fighters, world.Bullets, particles);

  if (Input.GUIMode) {
    Renderer.DrawUIFrame(canvas, cam, uiBackdrop);
  } else if ((character && character.HP > 0) || uiHealthbar.collapsing) {
    if (character) uiHealthbar.healthPercentage = character.HP / character.MaxHP;
    uiHealthbar.tick(DeltaTime);

    Renderer.DrawUIFrame(canvas, cam, uiHealthbar.base);
    Renderer.DrawUIFrame(canvas, cam, uiHealthbar.bar);
  }
  if (Input.ClassSelectOpen) {
    for (let i = 0; i < uiClassSelect.frames.length; i++) {
      doUIFrameInteraction(uiClassSelect.frames[i]);
      Renderer.DrawUIFrame(canvas, cam, uiClassSelect.frames[i]);
    }
  }
  if (Input.UsernameSelectOpen) {
    doUIFrameInteraction(uiBackdrop); // Enable clicking on backdrop to disable clicking
    for (let i = 0; i < uiUsernameSelect.frames.length; i++) {
      doUIFrameInteraction(uiUsernameSelect.frames[i]);
    }

    uiUsernameSelect.setCursorPosition(Renderer.GetTextWidth(canvas, cam, uiUsernameSelect.getTextBox()));
    uiUsernameSelect.tick(DeltaTime);

    for (let i = 0; i < uiUsernameSelect.frames.length; i++) {
      Renderer.DrawUIFrame(canvas, cam, uiUsernameSelect.frames[i]);
    }
  }
  if (Input.PlayerListOpen && !Input.GUIMode) Renderer.DrawPlayerList(canvas, cam, 'PING IS LIKE 60');
  if (respawnTimer > 0 && respawnTimer < 3) Renderer.DrawUIFrame(canvas, cam, uiKillCam);

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


/* eslint-disable no-console */
(function setup() {
  window.requestAnimationFrame(DoFrame);

  new NetworkClient(`ws://${window.location.host}/socket`)
    .connect()
    .then((connected) => {
      topics.ClientNetworkFromServer = connected.topicInbound;
      topics.ClientNetworkToServer = connected.topicOutbound;
      console.log('Connected OK!', connected);

      MessageBus.subscribe(topics.ClientNetworkFromServer, (msg: IEvent) => {
        switch (msg.type) {
          case TypeEnum.WorldState:
            stateUpdatePending = true;
            stateUpdate = msg;
            stateUpdateLastPacketTime = decodeInt64(msg.timestamp);
            break;
          case TypeEnum.PlayerState:
            UpdatePlayerState(msg);
            break;
          case TypeEnum.PlayerDied:
            OnDeath(msg.characterId, msg.killerId);
            break;
          case TypeEnum.PlayerConnect:
            // We have to save this in memory elsewhere for when fighters are selected
            // and finally connect into the world state. Updates are applied later.
            playerConnects = playerConnects.filter((x) => x.ownerId !== msg.ownerId); // Remove existing
            playerConnects.push(msg); // Add new
            console.log('Player connected', msg, 'Current players', playerConnects);
            break;
          default: // None
        }
      });
    })
    .catch((err) => console.error('Failed to connect!', err))
    .finally(() => console.log('... and finally!'));
}());
/* eslint-enable no-console */
