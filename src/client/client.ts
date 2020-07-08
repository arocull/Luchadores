/* eslint-disable object-curly-newline */
import _ from 'lodash';
import { sampleInputs, PlayerInput, Topics as InputTopics, KeyboardButtonInput } from './controls/playerinput';
import NetworkClient from './network/client';
import { MessageBus, Topics as BusTopics } from '../common/messaging/bus';
import { SubscriberContainer } from '../common/messaging/container';
import { decodeInt64 } from '../common/messaging/serde';
import { IEvent, TypeEnum } from '../common/events/index';
import { IPlayerConnect, IPlayerState, IWorldState, IPlayerListState } from '../common/events/events';
import decodeWorldState from './network/WorldStateDecoder';
import Vector from '../common/engine/Vector';
import Random from '../common/engine/Random';
import { Particle, PConfetti, PRosePetal, PSmashEffect } from './particles/index';
import { Fighter } from '../common/engine/fighters/index';
import { MakeAnimator } from './animation';
import Player from '../common/engine/Player';
import World from '../common/engine/World';
import RenderSettings from './RenderSettings';
import Camera from './Camera';
import { UIDeathNotification, UIPlayerInfo, UILoadScreen } from './ui/index';
import UIManager from './ui/UIManager';
import Renderer from './Render';
import { FighterType } from '../common/engine/Enums';
import Wristwatch from '../common/engine/time/Wristwatch';
import AssetPreloader from './AssetPreloader';
/* eslint-enable object-curly-newline */

// Set up base client things
const player = new Player('');
let character: Fighter = null;
let respawnTimer = 3; // Counts up from 0 until player is spawning
let spawningCharacter = false; // True if player has selected character and is waiting on assignment from server
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
const fpsCount: number[] = [];

const cam = new Camera(viewport.width, viewport.height, 18, 14);
cam.SetFocusPosition(new Vector(world.Map.Width / 2, world.Map.Height / 2, 0));

const uiLoadScreen = new UILoadScreen();
const uiManager = new UIManager();
const uiDeathNotifs: UIDeathNotification[] = [];
const uiPlayerList: UIPlayerInfo[] = [];

// Particles
const particles: Particle[] = [];
MessageBus.subscribe('Effect_NewParticle', (msg) => {
  particles.push(msg as Particle);
});


// Call when a PlayerConnect request is heard
function OnPlayerConnect(plr: Player) {
  playerConnects.push(plr);
  console.log(plr.getUsername(), ' has joined');
  uiPlayerList.push(new UIPlayerInfo(plr));
}
// Call when a PlayerDisconnect request is heard
function OnPlayerDisconnect(plr: Player) {
  for (let i = 0; i < playerConnects.length; i++) {
    if (playerConnects[i] === plr) {
      playerConnects.splice(i, 1);
      break;
    }
  }
  console.log(plr.getUsername(), ' has left');
  for (let i = 0; i < uiPlayerList.length; i++) {
    if (uiPlayerList[i].getOwner() === plr) {
      uiPlayerList.splice(i, 1);
      return;
    }
  }
}
// Updates player list state and the player list GUI
function OnPlayerListUpdate(msg: IPlayerListState) {
  player.assignCharacterID(msg.characterId);

  for (let i = 0; i < playerConnects.length; i++) {
    playerConnects[i].accountedFor = false;
  }

  for (let i = 0; i < msg.players.length; i++) {
    const id = msg.players[i].ownerId;
    let plr = null;
    let isNew: boolean = false;

    if (id === player.getCharacterID()) plr = player;
    else {
      for (let j = 0; j < playerConnects.length; j++) {
        if (id === playerConnects[j].getCharacterID()) {
          plr = playerConnects[j];
          break;
        }
      }
      if (!plr) {
        plr = new Player(`Player${id}`);
        isNew = true;
      }
    }

    plr.setUsername(msg.players[i].username);
    plr.assignCharacterID(id);
    plr.setKills(msg.players[i].kills);
    plr.updatePing(msg.players[i].averagePing);
    plr.accountedFor = true; // Mark that this player has been updated and thus accounted for

    if (isNew) OnPlayerConnect(plr);
  }

  // Prune any players that were not accounted for and count them as disconnects
  for (let i = 0; i < playerConnects.length; i++) {
    if (!playerConnects[i].accountedFor) {
      OnPlayerDisconnect(playerConnects[i]);
      i--;
    }
  }
}


// Call when server says a fighter died, hand it player ID's
function OnDeath(died: number, killer: number) {
  let diedName: string = '';
  let killFighter: Fighter = null;

  for (let i = 0; i < world.Fighters.length; i++) {
    if (world.Fighters[i].getOwnerID() === died) {
      if (world.Fighters[i].Animator) world.Fighters[i].Animator.destruct(); // Removes event listeners on animator
      PConfetti.Burst(particles, world.Fighters[i].Position, 0.2, 4, 50 * RenderSettings.ParticleAmount); // Burst into confetti!
      diedName = world.Fighters[i].DisplayName; // Get name of character who died
      world.Fighters.splice(i, 1); // Remove from list
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
    if (killFighter) {
      cam.LerpToFocus(killFighter);
      uiManager.playerDied(`Killed by ${killFighter.DisplayName}`);
    } else {
      uiManager.playerDied();
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
  if (uiManager.inGUIMode() && guiInputSubscribers == null) {
    // When we enter GUI mode, bind the events
    guiInputSubscribers = new SubscriberContainer();
    guiInputSubscribers.attach(InputTopics.keydown, (k: KeyboardButtonInput) => {
      uiManager.keyInput(k.key, k.shiftKey);
    });
  } else if (!uiManager.inGUIMode() && guiInputSubscribers != null) {
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
  uiManager.togglePlayerList(input.Keys.y === true);
}

function parseMouse(input: PlayerInput) {
  // Button 0 is left click
  Input.MouseDown = (input.MouseButtons[0] === true);

  Input.MouseX = input.MouseCoordinates.x;
  Input.MouseY = input.MouseCoordinates.y;

  if (character && character.isRanged() && Input.MouseDown) {
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

// Hacks to poll and update sampling from player input module.
// Should be refactored into something better.
function ScrapeInput() {
  const input = sampleInputs();
  parseKeys(input);
  parseMouse(input);

  if (uiManager.inGUIMode() || !character) {
    return; // Do not send input updates if the player is fiddling with UI
  }

  // The player should never have any move or aim input that points upward
  // TODO: Is this still needed?
  Input.MoveDirection.z = 0;
  Input.MouseDirection.z = 0;

  // Send input capture up to server
  MessageBus.publish(topics.ClientNetworkToServer, {
    type: TypeEnum.PlayerInputState,
    jump: Input.Jump,
    mouseDown: Input.MouseDown,
    mouseDirection: Input.MouseDirection,
    moveDirection: Input.MoveDirection,
  });
}

// UI Management
MessageBus.subscribe('PickUsername', (name: string) => {
  player.setUsername(name);

  MessageBus.publish(topics.ClientNetworkToServer, <IPlayerConnect>{
    type: TypeEnum.PlayerConnect,
    ownerId: -1, // We don't know this on this client yet - server will decide
    username: name,
  });

  uiManager.closeUsernameSelect();
  uiManager.openClassSelect();

  uiPlayerList.push(new UIPlayerInfo(player, true)); // Add self to the player list now that they are connected
});
MessageBus.subscribe('PickCharacter', (type: FighterType) => {
  respawnTimer = 3;
  spawningCharacter = true;
  uiManager.closeClassSelect();

  MessageBus.publish(topics.ClientNetworkToServer, {
    type: TypeEnum.PlayerSpawned,
    fighterClass: type,
  });
});


// State Updates
let stateUpdatePending = false; // Is there a WorldState update that is pending
let stateUpdateLastPacketTime = 0; // Time the world state packet was received
let stateUpdate: IWorldState = null; // WorldState event
let stateUpdateFirst = true; // Is this the first WorldState the client is receiving (applied map prop loading)?
function UpdatePlayerState(msg: IPlayerState) {
  const mismatch = msg.characterID !== player.getCharacterID();

  player.assignCharacterID(msg.characterID);

  if (mismatch && character) { // If there is a character ID mismatch, then we should remove current character
    character.HP = 0;
    character.LastHitBy = null;
    // TODO: Queue fighter for deletion (setting health to zero does not kill on client)--requires updated death management branch
  }

  if (character) character.HP = msg.health;
}

let LastFrame = 0;
function DoFrame(tick: number) {
  // Convert milliseconds to seconds
  const DeltaTime = (tick / 1000) - LastFrame;
  let worldDeltaTime = DeltaTime;
  LastFrame = tick / 1000;
  let appliedWorldState = false;

  // Capture inputs (updates `Input` global)
  ScrapeInput();

  if (stateUpdatePending && stateUpdate) {
    stateUpdatePending = false;

    for (let i = 0; i < world.Fighters.length; i++) { // Keeps track of how many WorldState updates each fighters missed
      world.Fighters[i].UpdatesMissed++;
    }

    decodeWorldState(stateUpdate, world, stateUpdateFirst);
    appliedWorldState = true;
    stateUpdateFirst = false;

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

    if (spawningCharacter) cam.LerpToFocus(character); // If this is the first frame character is available, lerp the camera position
    spawningCharacter = false; // Character has spawned, act as normal

    cam.SetFocus(character);
  }

  world.tick(worldDeltaTime, appliedWorldState);

  // Update Camera
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;
  cam.Scale(viewport.width, viewport.height);
  cam.UpdateFocus(DeltaTime);

  // Apply visual effects
  for (let i = 0; i < world.Fighters.length; i++) {
    const a = world.Fighters[i];
    if (a) {
      if (a.getOwnerID() === player.getCharacterID()) character = a; // Set new character

      // Tick animators, prune and generate new ones based off of need
      if (!a.Animator) a.Animator = MakeAnimator(a);
      else if (a.Animator) {
        a.Animator.Tick(DeltaTime);
        if (a.Animator.killEffectCountdown === 0) {
          PRosePetal.Burst(particles, a.Position, 0.2, 5, 20 * RenderSettings.ParticleAmount);
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
  } else if (!(uiManager.isClassSelectOpen() || uiManager.isUsernameSelectOpen())) { // Do not tick if player is selecting username or character
    respawnTimer -= DeltaTime;

    if (respawnTimer <= 0) { // If their respawn timer reached 0, pull up class elect again
      uiManager.openClassSelect();
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

  // Draw world
  Renderer.DrawScreen(canvas, cam, world.Map, world.Fighters, world.Bullets, particles, world.Props);
  // Then draw UI
  uiManager.tick(DeltaTime, canvas, cam, character, clientConnected, spawningCharacter, Input);

  if (uiManager.isPlayerListOpen() && !uiManager.inGUIMode()) {
    Renderer.DrawPlayerList(canvas, cam, 'Player List');
    for (let i = 0; i < uiPlayerList.length; i++) {
      uiPlayerList[i].update();
      uiPlayerList[i].cornerY = UIPlayerInfo.CORNERY_OFFSET + (i + 1) * UIPlayerInfo.HEIGHT;
      Renderer.DrawUIFrame(canvas, cam, uiPlayerList[i]);
    }
  }
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

  if (RenderSettings.FPScounter) {
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
  Promise.all([
    preloader.preload()
      .then(() => {
        console.log('Asset preloading complete.');
        window.requestAnimationFrame(DoFrame);
      }),
    ws.connect(),
  ])
    .then((results) => {
      const connected = results[1];
      topics.ClientNetworkFromServer = connected.topicInbound;
      topics.ClientNetworkToServer = connected.topicOutbound;
      console.log('Connected OK!', connected);

      console.log('Synchronizing wristwatches...');
      return Wristwatch.syncWith(ws.getPingHandler());
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
      MessageBus.subscribe(BusTopics.Connections, (msg: IEvent) => {
        if (msg.type === TypeEnum.ClientDisconnected) {
          clientConnected = false;
          uiManager.setConnectionText('Connection lost - Reload the webpage');
        }
      });

      MessageBus.subscribe(topics.ClientNetworkFromServer, (msg: IEvent) => {
        switch (msg.type) {
          case TypeEnum.WorldState:
            stateUpdatePending = true;
            stateUpdate = msg;
            stateUpdateLastPacketTime = decodeInt64(msg.timestamp);
            break;
          case TypeEnum.PlayerListState:
            OnPlayerListUpdate(msg);
            break;
          case TypeEnum.PlayerState:
            UpdatePlayerState(msg);
            break;
          case TypeEnum.PlayerDied:
            OnDeath(msg.characterId, msg.killerId);
            break;
          default: // None
        }
      });
    })
    .catch((err) => {
      console.error('Failed to connect!', err);
      uiManager.setConnectionText('Connection failed - Reload the webpage');
    })
    .finally(() => console.log('... and finally!'));
}());
/* eslint-enable no-console */
