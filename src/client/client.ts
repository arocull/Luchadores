/* eslint-disable object-curly-newline */
import _ from 'lodash';
import {
  sampleInputs, PlayerInput, Topics as InputTopics, KeyboardButtonInput,
} from './controls/playerinput';
import NetworkClient from './network/client';
import { MessageBus } from '../common/messaging/bus';
import { SubscriberContainer } from '../common/messaging/container';
import { decodeInt64 } from '../common/messaging/serde';
import { IEvent, TypeEnum } from '../common/events/index';
import { IPlayerConnect, IPlayerState, IWorldState } from '../common/events/events';
import decodeWorldState from './network/WorldStateDecoder';
import Vector from '../common/engine/Vector';
import Random from '../common/engine/Random';
import { Particle, PConfetti, PRosePetal, PSmashEffect } from './particles/index';
import { Fighter, Flamingo } from '../common/engine/fighters/index';
import Animator from './animation/Animator';
import Player from '../common/engine/Player';
import World from '../common/engine/World';
import RenderSettings from './RenderSettings';
import Camera from './Camera';
import { UIFrame, UIClassSelect, UIUsernameSelect, UIHealthbar, UITextBox, UIDeathNotification, UIPlayerInfo, UILoadScreen } from './ui/index';
import Renderer from './Render';
import { FighterType } from '../common/engine/Enums';
import Wristwatch from '../common/engine/time/Wristwatch';
import AssetPreloader from './AssetPreloader';
/* eslint-enable object-curly-newline */

// Set up base client things
const player = new Player('');
// eslint-disable-next-line
let luchador: FighterType = FighterType.Sheep;
let character: Fighter = null;
let respawnTimer = 3;
let clientConnected: boolean = false;

// Generate World
const world = new World();
world.Map.loadTexture();
Random.randomSeed();

const playerConnects: Player[] = [player];

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

const uiLoadScreen = new UILoadScreen();
const connectingText = new UITextBox(0.01, 0.925, 1, 0.05, false, 'Stabilizing connection...');
const uiBackdrop = new UIFrame(0, 0, 1, 1, false);
const uiClassSelect = new UIClassSelect(2, 2, 3);
const uiUsernameSelect = new UIUsernameSelect();
const uiHealthbar = new UIHealthbar();
const uiSpecialBar = new UIHealthbar();
const uiKillCam = new UITextBox(0, 0.9, 1, 0.1, false, '');
const uiDeathNotifs: UIDeathNotification[] = [];
const uiPlayerList: UIPlayerInfo[] = [];

// Particles
const particles: Particle[] = [];
MessageBus.subscribe('Effect_NewParticle', (msg) => {
  particles.push(msg as Particle);
});


// Call when a PlayerConnect request is heard
function OnPlayerConnect(charID: number, username: string) {
  if (charID === player.getCharacterID()) return;
  // Remove the player from the list if they already exist
  // - could be new player taking up character ID of old player that left
  for (let i = 0; i < playerConnects.length; i++) {
    if (playerConnects[i].getCharacterID() === charID) {
      playerConnects.splice(i, 1);
      break;
    }
  }

  const newPlayer = new Player(`Player${charID}`); // Just fill string with something interesting so we can easier differentiate
  newPlayer.setUsername(username);
  newPlayer.assignCharacterID(charID);

  playerConnects.push(newPlayer);

  uiPlayerList.push(new UIPlayerInfo(newPlayer));
}
// Call when a PlayerDisconnect request is heard
function OnPlayerDisconnect(charID: number) {
  let discPlayer = null;
  for (let i = 0; i < playerConnects.length; i++) {
    if (playerConnects[i].getCharacterID() === charID) {
      discPlayer = playerConnects[i];
      playerConnects.splice(i, 1);
      break;
    }
  }

  for (let i = 0; i < uiPlayerList.length; i++) {
    if (uiPlayerList[i].getOwner() === discPlayer) {
      uiPlayerList.splice(i, 1);
      return;
    }
  }
}
// Call when server says a fighter died, hand it player ID's
function OnDeath(died: number, killer: number) {
  let diedName: string = '';
  let killFighter: Fighter = null;

  for (let i = 0; i < world.Fighters.length; i++) {
    if (world.Fighters[i].getOwnerID() === died) {
      PConfetti.Burst(particles, world.Fighters[i].Position, 0.2, 4, 50 * renderSettings.ParticleAmount);
      diedName = world.Fighters[i].DisplayName;
      world.Fighters.splice(i, 1);
      i--;
    } else if (world.Fighters[i].getOwnerID() === killer) {
      world.Fighters[i].EarnKill();
      killFighter = world.Fighters[i];
      if (world.Fighters[i].Animator) world.Fighters[i].Animator.killEffectCountdown = 1;

      for (let j = 0; j < playerConnects.length; j++) {
        if (playerConnects[j].getCharacterID() === world.Fighters[i].getOwnerID()) {
          playerConnects[j].earnKill();
          break;
        }
      }
    }
  }

  if (died === player.getCharacterID()) { // Set camera focus to your killer as a killcam until you respawn
    character = null;
    uiHealthbar.healthPercentage = 0;
    uiHealthbar.collapse();
    if (killFighter) {
      cam.SetFocus(killFighter);
      uiKillCam.text = `Killed by ${killFighter.DisplayName}`;
    }
  }

  if (killFighter) {
    uiDeathNotifs.push(new UIDeathNotification(
      diedName,
      killFighter.DisplayName,
      killFighter.getCharacter(),
      died === player.getCharacterID(),
      killer === player.getCharacterID(),
    ));
  } else {
    uiDeathNotifs.push(new UIDeathNotification(
      diedName,
      null,
      FighterType.None,
      died === player.getCharacterID(),
      false,
    ));
  }

  // Rank player list by kills
  uiPlayerList.sort(UIPlayerInfo.SORT);
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

let guiInputSubscribers: SubscriberContainer = null;
function parseKeys(input: PlayerInput) {
  // Type into username textbox
  if (Input.UsernameSelectOpen && guiInputSubscribers == null) {
    // When we enter GUI mode, bind the events
    guiInputSubscribers = new SubscriberContainer();
    guiInputSubscribers.attach(InputTopics.keydown, (k: KeyboardButtonInput) => {
      if (k.key === 'Enter') {
        uiUsernameSelect.enter();
      } else if (k.key === 'Backspace') {
        uiUsernameSelect.backspace();
      } else if (k.key.length === 1) {
        uiUsernameSelect.shift(k.shiftKey);
        uiUsernameSelect.typeCharacter(k.key);
      }
    });
  } else if (!Input.UsernameSelectOpen && guiInputSubscribers != null) {
    // When we leave GUI mode, unbind the events
    guiInputSubscribers.detachAll();
  }

  if (input.Keys.a === true) Input.MoveDirection.x = -1;
  else if (input.Keys.d === true) Input.MoveDirection.x = 1;
  else Input.MoveDirection.x = 0;

  if (input.Keys.w === true) Input.MoveDirection.y = 1;
  else if (input.Keys.s === true) Input.MoveDirection.y = -1;
  else Input.MoveDirection.y = 0;

  Input.Jump = (input.Keys[' '] === true);
  Input.PlayerListOpen = (input.Keys.y === true);
}

function parseMouse(input: PlayerInput) {
  // Button 0 is left click
  Input.MouseDown = (input.MouseButtons[0] === true);

  if (Input.GUIMode) {
    Input.MouseX = input.MouseCoordinates.x;
    Input.MouseY = input.MouseCoordinates.y;
  } else if (character && character.isRanged() && Input.MouseDown) {
    // If the character is present, we should grab mouse location based off of where projectiles are likely to be fired
    const dir = Vector.UnitVectorXY(
      Vector.Subtract(
        cam.PositionOffset(character.Position),
        input.MouseCoordinates,
      ),
    );
    dir.x *= -1;
    Input.MouseDirection = dir;
  } else {
    Input.MouseDirection = Vector.UnitVectorFromXYZ(
      input.MouseCoordinates.x - (viewport.width / 2),
      (viewport.height / 2) - input.MouseCoordinates.y,
      0,
    );
  }
}

// TODO: TEMPORARY HACK WHILE FIGURING OUT INPUT LOAD ON SERVER
const inputThrottled = _.throttle(() => {
  // Send input capture up to server
  MessageBus.publish(topics.ClientNetworkToServer, {
    type: TypeEnum.PlayerInputState,
    jump: Input.Jump,
    mouseDown: Input.MouseDown,
    mouseDirection: Input.MouseDirection,
    moveDirection: Input.MoveDirection,
  });
}, 100);

// Hacks to poll and update sampling from player input module.
// Should be refactored into something better.
function ScrapeInput() {
  const input = sampleInputs();
  parseKeys(input);
  parseMouse(input);

  if (Input.GUIMode || !character) {
    return; // Do not send input updates if the player is fiddling with UI
  }

  // The player should never have any move or aim input that points upward
  // TODO: Is this still needed?
  Input.MoveDirection.z = 0;
  Input.MouseDirection.z = 0;

  // Send input capture up to server
  inputThrottled();
}

// UI Management
uiBackdrop.alpha = 0.25;
uiBackdrop.renderStyle = '#000000';
uiBackdrop.onClick = (() => {
  uiUsernameSelect.deselect();
});
connectingText.alpha = 0;
connectingText.textStyle = '#ffffff';
connectingText.textAlignment = 'left';
uiKillCam.alpha = 0;
uiKillCam.textFont = 'flamenco';
uiKillCam.textFontSize = 60;
uiSpecialBar.POSY -= UIHealthbar.HEIGHT * 1.25;
uiSpecialBar.reset();
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

  uiPlayerList.push(new UIPlayerInfo(player, true)); // Add self to the player list now that they are connected
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

let LastFrame = 0;
function DoFrame(tick: number) {
  // Convert milliseconds to seconds
  const DeltaTime = (tick / 1000) - LastFrame;
  let worldDeltaTime = DeltaTime;
  LastFrame = tick / 1000;

  // Capture inputs (updates `Input` global)
  ScrapeInput();

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
    worldDeltaTime = (Wristwatch.getSyncedNow() - stateUpdateLastPacketTime) / 1000;
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
          if (playerConnects[j] && playerConnects[j].getCharacterID() === a.getOwnerID()) {
            playerConnects[j].assignCharacter(a);
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
    if (!clientConnected) Renderer.DrawUIFrame(canvas, cam, connectingText);
  } else if ((character && character.HP > 0) || uiHealthbar.collapsing) {
    if (character) uiHealthbar.healthPercentage = character.HP / character.MaxHP;
    uiHealthbar.tick(DeltaTime);

    Renderer.DrawUIFrame(canvas, cam, uiHealthbar.base);
    Renderer.DrawUIFrame(canvas, cam, uiHealthbar.barBack);
    Renderer.DrawUIFrame(canvas, cam, uiHealthbar.bar);
    uiHealthbar.checkReset();

    let useSpecialBar = false;
    if (character && character.getCharacter() === FighterType.Flamingo) {
      useSpecialBar = true;

      const flam = <Flamingo>(character);
      uiSpecialBar.healthPercentage = flam.getBreath() / 50;
      uiSpecialBar.barBack.renderStyle = '#732303';
      if (flam.isBreathing()) uiSpecialBar.bar.renderStyle = '#929190';
      else uiSpecialBar.bar.renderStyle = '#e0a524';
    }
    if (useSpecialBar) {
      uiSpecialBar.tick(DeltaTime);
      Renderer.DrawUIFrame(canvas, cam, uiSpecialBar.base);
      Renderer.DrawUIFrame(canvas, cam, uiSpecialBar.barBack);
      Renderer.DrawUIFrame(canvas, cam, uiSpecialBar.bar);
      uiSpecialBar.checkReset();
    }
  }
  if (Input.ClassSelectOpen) {
    if (clientConnected) uiClassSelect.addConfirmButton();
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
  if (Input.PlayerListOpen && !Input.GUIMode) {
    Renderer.DrawPlayerList(canvas, cam, 'Player List');
    for (let i = 0; i < uiPlayerList.length; i++) {
      uiPlayerList[i].update();
      uiPlayerList[i].cornerY = UIPlayerInfo.CORNERY_OFFSET + (i + 1) * UIPlayerInfo.HEIGHT;
      Renderer.DrawUIFrame(canvas, cam, uiPlayerList[i]);
    }
  }
  if (respawnTimer > 0 && respawnTimer < 3) Renderer.DrawUIFrame(canvas, cam, uiKillCam);

  for (let i = 0; i < uiDeathNotifs.length; i++) {
    uiDeathNotifs[i].timeLeft -= DeltaTime;
    if (uiDeathNotifs[i].timeLeft <= 0) {
      uiDeathNotifs.splice(i, 1);
      i--;
    } else {
      uiDeathNotifs[i].cornerY = i * UIDeathNotification.HEIGHT + UIDeathNotification.OFFSET;
      Renderer.DrawUIFrame(canvas, cam, uiDeathNotifs[i]);
    }
  }

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

const preloader = new AssetPreloader([
  'Maps/Arena.jpg',
  'Maps/Grass.jpg',
  'Portraits/Deer.png',
  'Portraits/Flamingo.png',
  'Portraits/Sheep.png',
  'Sprites/Flamingo.png',
  'Sprites/Sheep.png',
]);

/* eslint-disable no-console */
(function setup() {
  console.log('Preloading assets ...');
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;
  cam.Scale(viewport.width, viewport.height);
  for (let i = 0; i < uiLoadScreen.frames.length; i++) {
    Renderer.DrawUIFrame(canvas, cam, uiLoadScreen.frames[i]);
  }

  preloader.preload().then(() => {
    console.log('Asset preloading complete.');
    window.requestAnimationFrame(DoFrame);
  });
  preloader.on('progress', (status) => {
    console.log(`Preload progress: ${_.round(status.progress * 100, 1)}% ... (${status.file})`);

    viewport.width = window.innerWidth;
    viewport.height = window.innerHeight;
    cam.Scale(viewport.width, viewport.height);

    uiLoadScreen.update(status.progress);
    for (let i = 0; i < uiLoadScreen.frames.length; i++) {
      Renderer.DrawUIFrame(canvas, cam, uiLoadScreen.frames[i]);
    }
  });

  const ws = new NetworkClient(`ws://${window.location.host}/socket`);
  ws.connect()
    .then((connected) => {
      topics.ClientNetworkFromServer = connected.topicInbound;
      topics.ClientNetworkToServer = connected.topicOutbound;
      console.log('Connected OK!', connected);

      console.log('Synchronizing wristwatches...');
      return Wristwatch.syncWith(ws.getPingHandler(), 5000);
    })
    .then(() => {
      console.log(
        'Synchronized! Calculated drift:', Wristwatch.getClockDriftToRemote(),
        'Synced time:', Wristwatch.getSyncedNow(),
      );
      return Promise.resolve();
    })
    .then(() => {
      clientConnected = true;
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
            OnPlayerConnect(msg.ownerId, msg.username);
            break;
          case TypeEnum.PlayerDisconnect:
            OnPlayerDisconnect(msg.ownerId);
            break;
          default: // None
        }
      });
    })
    .catch((err) => console.error('Failed to connect!', err))
    .finally(() => console.log('... and finally!'));
}());
/* eslint-enable no-console */
