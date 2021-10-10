/* eslint-disable object-curly-newline */
/* eslint-disable padded-blocks */
import { sampleInputs, PlayerInput, Topics as InputTopics, KeyboardButtonInput } from './controls/playerinput';
import NetworkClient from './network/client';
import { MessageBus, Topics as BusTopics } from '../common/messaging/bus';
import { SubscriberContainer } from '../common/messaging/container';
import { decodeInt64 } from '../common/messaging/serde';
import { IEvent, TypeEnum } from '../common/events/index';
import { IPlayerConnect, IPlayerState, IWorldState, IPlayerListState } from '../common/events/events';
import decodeWorldState from './network/WorldStateDecoder';
import World from '../common/engine/World';
import Player from '../common/engine/Player';
import Fighter from '../common/engine/Fighter';
import Random from '../common/engine/Random';
import Camera from './Camera';
import { FighterType } from '../common/engine/Enums';
import { UIDeathNotification, UIPlayerInfo } from './ui';
import UIManager from './ui/UIManager';
import { Vector } from '../common/engine/math';
import InputState from './controls/InputState';
import Wristwatch from '../common/engine/time/Wristwatch';
/* eslint-enable object-curly-newline */


// Client State - Main data handler for clients
class Client {
  // Player and Character objects
  public player: Player;
  public character: Fighter;

  // Respawn info
  public respawnTimer: number;
  public respawning: boolean;
  public lastHP: number;

  // Networking
  public connected: boolean;
  private playerList: Player[];
  private topics: any;

  // Inputs
  public input: InputState;
  private inputSubscribers: SubscriberContainer;

  // World Data
  private world: World;
  private worldUpdatePending: boolean; // Is there a WorldState update that is pending
  private worldUpdateLastPacketTime: number; // Time the world state packet was received
  private worldUpdate: IWorldState; // WorldState event
  private worldUpdateFirst: boolean; // Is this the first WorldState the client is receiving (applied map prop loading)?

  // Render Hook-Ups, contain some render data but also important information
  private screenWidth: number;
  private screenHeight: number;
  public camera: Camera;
  private uiPlayerList: UIPlayerInfo[];
  private uiDeathNotifs: UIDeathNotification[];
  public uiManager: UIManager; // Hook-up, should not be auto-generated

  constructor(connectionURL: string, doConnect: boolean) {
    this.player = new Player('');
    this.character = null;

    this.respawnTimer = 3; // Counts up from 0 until player is spawning
    this.respawning = false; // True if player has selected character and is waiting on assignment from server

    this.connected = false;
    this.playerList = [this.player];
    this.topics = { // TODO: HAX - get topics to use from web socket
      ClientNetworkToServer: null as string,
      ClientNetworkFromServer: null as string,
    };

    this.input = new InputState();
    this.inputSubscribers = null;

    // Initialize basic, empty world for player to roam around in if we use it
    // Is populated and changed when player connects
    this.world = new World();
    Random.randomSeed();

    this.worldUpdatePending = false;
    this.worldUpdateLastPacketTime = 0;
    this.worldUpdate = null;
    this.worldUpdateFirst = true;

    // Initialize render hookups (implemented by ClientGraphics module)
    this.screenWidth = 600;
    this.screenHeight = 400;
    this.camera = new Camera(this.screenWidth, this.screenHeight, 18, 14);
    this.camera.SetFocusPosition(new Vector(this.world.Map.Width / 2, this.world.Map.Height / 2, 0));
    this.uiPlayerList = [];
    this.uiDeathNotifs = [];
    this.uiManager = null;


    // Set up message bus events
    MessageBus.subscribe('PickUsername', (name: string) => {
      MessageBus.publish(this.topics.ClientNetworkToServer, <IPlayerConnect>{
        type: TypeEnum.PlayerConnect,
        ownerId: -1, // We don't know this on this client yet - server will decide
        username: name,
      });
    });
    MessageBus.subscribe('PickUsernameSuccess', (name: string) => {
      this.player.setUsername(name); // Username was confirmed, this is a GO

      if (this.uiManager) {
        this.uiManager.closeUsernameSelect();
        this.uiManager.openClassSelect();

        this.uiPlayerList.push(new UIPlayerInfo(this.player, true));
      }
    });
    MessageBus.subscribe('PickCharacter', (type: FighterType) => {
      this.respawnTimer = 3;
      this.respawning = true;

      if (this.uiManager) this.uiManager.closeClassSelect();

      MessageBus.publish(this.topics.ClientNetworkToServer, {
        type: TypeEnum.PlayerSpawned,
        fighterClass: type,
      });
    });


    // Finally, perform connection
    if (doConnect) {
      const ws = new NetworkClient(`ws://${connectionURL}/socket`);
      ws.connect()
        .then((connected) => {
          this.topics.ClientNetworkFromServer = connected.topicInbound;
          this.topics.ClientNetworkToServer = connected.topicOutbound;
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
          this.connected = true;
          MessageBus.subscribe(BusTopics.Connections, (msg: IEvent) => {
            if (msg.type === TypeEnum.ClientDisconnected) {
              this.connected = false;
              if (this.uiManager) this.uiManager.setConnectionText('Connection lost - Reload the webpage');
            }
          });

          MessageBus.subscribe(this.topics.ClientNetworkFromServer, (msg: IEvent) => {
            switch (msg.type) {
              case TypeEnum.WorldState:
                this.worldUpdatePending = true;
                this.worldUpdate = msg;
                this.worldUpdateLastPacketTime = decodeInt64(msg.timestamp);
                break;
              case TypeEnum.PlayerListState:
                this.onPlayerListUpdate(msg);
                break;
              case TypeEnum.PlayerState:
                this.updatePlayerState(msg);
                break;
              case TypeEnum.PlayerDied:
                this.onDeath(msg.characterId, msg.killerId);
                break;
              case TypeEnum.PlayerConnectResponse:
                MessageBus.publish('PlayerConnectResponse', msg.response);
                break;
              default: // None
            }
          });
        })
        .catch((err) => {
          console.error('Failed to connect!', err);
          if (this.uiManager) this.uiManager.setConnectionText('Connection failed - Reload the webpage');
        })
        .finally(() => console.log('... and finally!'));
    }
  }


  /* Player Connection Events */

  // Call when a player joins--adds them to the player list and creates player info slip
  private onPlayerConnect(plr: Player) {
    this.playerList.push(plr);
    this.uiPlayerList.push(new UIPlayerInfo(plr));
  }
  // Call when a player leaves--removes from player list and remove their info slip
  private onPlayerDisconnect(plr: Player) {
    for (let i = 0; i < this.playerList.length; i++) {
      if (this.playerList[i] === plr) {
        this.playerList.splice(i, 1);
        break;
      }
    }
    for (let i = 0; i < this.uiPlayerList.length; i++) {
      if (this.uiPlayerList[i].getOwner() === plr) {
        this.uiPlayerList.splice(i, 1);
        return;
      }
    }
  }
  // Takes a player list state provided by server and deciphers it
  private onPlayerListUpdate(msg: IPlayerListState) {
    this.player.assignCharacterID(msg.characterId);

    for (let i = 0; i < this.playerList.length; i++) {
      this.playerList[i].accountedFor = false;
    }

    for (let i = 0; i < msg.players.length; i++) {
      const id = msg.players[i].ownerId;
      let plr = null;
      let isNew: boolean = false;

      if (id === msg.characterId) plr = this.player;
      else {
        for (let j = 0; j < this.playerList.length; j++) {
          if (id === this.playerList[j].getCharacterID()) {
            plr = this.playerList[j];
            break;
          }
        }
        if (!plr) { // If player does not exist in current list, create them
          plr = new Player(`Player${id}`);
          isNew = true;
        }
      }

      // Update player info
      plr.setUsername(msg.players[i].username);
      plr.assignCharacterID(id);
      plr.setKills(msg.players[i].kills);
      // TODO: Set max killstreak and/or current killstreak?
      plr.updatePing(msg.players[i].averagePing);
      plr.accountedFor = true;

      if (isNew) this.onPlayerConnect(plr);
    }

    // Prune players that were not accounted for
    for (let i = 0; i < this.playerList.length; i++) {
      if (!this.playerList[i].accountedFor) {
        this.onPlayerDisconnect(this.playerList[i]);
        i--;
      }
    }
  }
  // Returns player for the corresponding character ID
  private getPlayerFromCharacterID(characterID: number): Player {
    for (let i = 0; i < this.playerList.length; i++) {
      if (this.playerList[i] && this.playerList[i].getCharacterID() === characterID) {
        return this.playerList[i];
      }
    }
    return null; // No player object found, return null
  }


  /* Death and Kill Management */

  // Calls when a player is killed
  private onDeath(died: number, killer: number) {
    let diedName: string = '';
    let killerCharacter: Fighter = null;
    let diedCharacter: Fighter = null;

    for (let i = 0; i < this.world.Fighters.length; i++) { // Iterate through all fighters

      if (this.world.Fighters[i].getOwnerID() === died) { // Character is killed
        diedCharacter = this.world.Fighters[i];
        MessageBus.publish('Effect_PlayerDied', diedCharacter.Position);
        diedName = diedCharacter.DisplayName; // Obtain this honorable luchador's name
        diedCharacter.MarkedForCleanup = true; // Mark for cleanup (allows kill counting before removal)

      } else if (this.world.Fighters[i].getOwnerID() === killer) { // Character that did it
        killerCharacter = this.world.Fighters[i]; // Keep track of killer (for killcam)
        killerCharacter.EarnKill(); // Earn kill and perform kill reward functions
        if (killerCharacter.Animator) killerCharacter.Animator.killEffectCountdown = 1; // Timer for rose petal shower

        const killerPlayer = this.getPlayerFromCharacterID(killer);
        if (killerPlayer) killerPlayer.earnKill(); // Count kill for killer's player
      }
    }

    if (died === this.player.getCharacterID()) { // Death effects and killcam
      this.character = null;
      this.respawning = false;
      this.respawnTimer = 3;
      if (killerCharacter) {
        this.camera.LerpToFocus(killerCharacter);
        if (this.uiManager) this.uiManager.playerDied(`Killed by ${killerCharacter.DisplayName}`);
      } else if (this.uiManager) {
        this.uiManager.playerDied();
      }
    }

    if (killerCharacter) { // Show specific death message
      this.uiDeathNotifs.push(new UIDeathNotification(
        diedName,
        killerCharacter.DisplayName,
        killerCharacter.getCharacter(),
        died === this.player.getCharacterID(),
        killer === this.player.getCharacterID(),
      ));

      MessageBus.publish('Announcer_Kill', diedCharacter);
    } else { // Show generic death message
      this.uiDeathNotifs.push(new UIDeathNotification(
        diedName,
        null,
        FighterType.None,
        died === this.player.getCharacterID(),
        false,
      ));
    }

    // Rank player list by kills
    this.uiPlayerList.sort(UIPlayerInfo.SORT);
  }


  /* User Input */
  private parseKeys(input: PlayerInput) {
    if (this.uiManager === null) return; // Do not attempt to parse input if no UI manager present

    // Type into username textbox
    if (this.uiManager.inGUIMode() && this.inputSubscribers == null) {
      // When we enter GUI mode, bind the events
      this.inputSubscribers = new SubscriberContainer();
      this.inputSubscribers.attach(InputTopics.keydown, (k: KeyboardButtonInput) => {
        this.uiManager.keyInput(k.key); // , k.shiftKey
      });
    } else if (!this.uiManager.inGUIMode() && this.inputSubscribers != null) {
      // When we leave GUI mode, unbind the events
      this.inputSubscribers.detachAll();
    }

    if (input.Keys.a === true) this.input.MoveDirection.x = -1;
    else if (input.Keys.d === true) this.input.MoveDirection.x = 1;
    else this.input.MoveDirection.x = 0;

    if (input.Keys.w === true) this.input.MoveDirection.y = 1;
    else if (input.Keys.s === true) this.input.MoveDirection.y = -1;
    else this.input.MoveDirection.y = 0;

    this.input.Jump = (input.Keys[' '] === true);
    this.uiManager.togglePlayerList(input.Keys.y === true);
  }
  private parseMouse(input: PlayerInput) {
    // Button 0 is left click
    this.input.MouseDown = (input.MouseButtons[0] === true);

    this.input.MouseX = input.MouseCoordinates.x;
    this.input.MouseY = input.MouseCoordinates.y;

    if (this.character && this.character.isRanged() && this.input.MouseDown) {
      // If the character is present, we should grab mouse location based off of where projectiles are likely to be fired
      const dir = Vector.UnitVectorXY(
        Vector.Subtract(
          this.camera.PositionOffset(this.character.Position),
          input.MouseCoordinates,
        ),
      );
      dir.x *= -1;
      this.input.MouseDirection = dir;
    } else { // Otherwise, do simple direction calculation
      this.input.MouseDirection = Vector.UnitVectorFromXYZ(
        input.MouseCoordinates.x - (this.screenWidth / 2),
        (this.screenHeight / 2) - input.MouseCoordinates.y,
        0,
      );
    }
  }
  private scrapeInput() {
    const inp = sampleInputs();
    this.parseKeys(inp);
    this.parseMouse(inp);

    // Disable inputs if in GUI mode to prevent constant firing and movement while in menus
    if (this.uiManager && (this.uiManager.inGUIMode() || !this.character)) {
      this.clearInput();
    }

    MessageBus.publish(this.topics.ClientNetworkToServer, {
      type: TypeEnum.PlayerInputState,
      jump: this.input.Jump,
      mouseDown: this.input.MouseDown,
      mouseDirection: this.input.MouseDirection,
      moveDirection: this.input.MoveDirection,
    });
  }
  /**
   * @function clearInput
   * @summary Clears jump, mouse down, and move direction inputs
   */
  private clearInput() {
    this.input.Jump = false;
    this.input.MouseDown = false;
    this.input.MoveDirection = new Vector(0, 0, 0);
  }


  /* State Updates */
  private updatePlayerState(msg: IPlayerState) {
    const mismatch = msg.characterID !== this.player.getCharacterID();

    this.player.assignCharacterID(msg.characterID);

    if (mismatch && this.character) { // Kill character if there was an ID mismatch
      this.character.HP = 0;
      this.character.LastHitBy = null;
      this.character.MarkedForCleanup = true;
    }

    if (this.character) this.character.HP = msg.health;
  }


  /* Render Hookup */
  public scaleScreen(newWidth: number, newHeight: number) {
    this.screenWidth = newWidth;
    this.screenHeight = newHeight;
    this.camera.Scale(newWidth, newHeight);
  }


  /* Tick */
  // Updates time by X seconds
  public tick(DeltaTime: number) {
    let appliedWorldState = false;
    let worldDeltaTime = DeltaTime;

    this.input.MouseDownLastFrame = this.input.MouseDown;
    this.scrapeInput(); // Capture inputs (updates this.input)

    // Prune fighters that have died, and add names to those who don't have ones
    for (let i = 0; i < this.world.Fighters.length; i++) {
      const fighter = this.world.Fighters[i];
      if (fighter.MarkedForCleanup) {
        const plr = this.getPlayerFromCharacterID(fighter.getOwnerID());
        if (plr) plr.removeCharacter(); // Remove player character

        this.world.Fighters.splice(i, 1);
        i--;
      } else if (!fighter.DisplayName) { // If they do not have a name, make one for them
        const owner = this.getPlayerFromCharacterID(fighter.getOwnerID());
        if (owner) owner.assignCharacter(fighter);
      }
    }


    if (this.worldUpdatePending && this.worldUpdate) {
      this.worldUpdatePending = false;

      // Applies world state and resets UpdateMissed on all updated fighters
      decodeWorldState(this.worldUpdate, this.world, this.worldUpdateFirst);
      appliedWorldState = true;
      this.worldUpdateFirst = false;

      // Prune fighters who fail to recieve consistent updates from server
      for (let i = 0; i < this.world.Fighters.length; i++) {
        this.world.Fighters[i].UpdatesMissed++;
        if (this.world.Fighters[i].UpdatesMissed > 5) {
          this.onDeath(this.world.Fighters[i].getOwnerID(), -1);
        }
      }

      // TODO: Get server time in client-server handshake and use that for time calculations
      worldDeltaTime = (Wristwatch.getSyncedNow() - this.worldUpdateLastPacketTime) / 1000;
    }

    if (!this.character) { // Look for character that matches ID if one does not already exist
      for (let i = 0; i < this.world.Fighters.length; i++) {
        if (this.world.Fighters[i].getOwnerID() === this.player.getCharacterID()) {
          this.character = this.world.Fighters[i];
          this.character.DisplayName = this.player.getUsername();
          this.respawning = true; // Mark as 'respawning' for camera lerp and UI
          break;
        }
      }
    }
    if (this.character) { // Apply user inputs and set camera focus
      if (this.input.Jump) this.character.Jump();
      this.character.Move(this.input.MoveDirection);
      this.character.aim(this.input.MouseDirection);
      this.character.Firing = this.input.MouseDown;

      // Send out a message if the player took damage
      const dmgTaken = this.lastHP - this.character.HP;
      if (dmgTaken !== 0) {
        MessageBus.publish('Audio_DamageTaken', {
          dmg: dmgTaken / this.character.MaxHP, // Percentage of maximum health that changed
          fighterType: this.character.getCharacter(), // Fighter type (for audio)
        });
      }
      this.lastHP = this.character.HP;

      if (this.respawning) { // If they are respawning (newly assigned character), lerp camera focus to them and close class select if open
        this.respawning = false;
        this.camera.LerpToFocus(this.character);
        if (this.uiManager) this.uiManager.closeClassSelect();
      }
      this.respawnTimer = 3;

      this.camera.SetFocus(this.character);
    }

    this.world.tick(worldDeltaTime, appliedWorldState);
    // Camera and visuals ticked separately on ClientGraphics

    if (this.character) { // Apply bullet shock
      this.camera.Shake += this.character.BulletShock;
    } else if (!this.uiManager || !(this.uiManager.isClassSelectOpen() || this.uiManager.isUsernameSelectOpen())) { // Do not tick if player is selecting username or character
      this.respawnTimer -= DeltaTime; // Count down respawn timer to zero from three

      if (this.respawnTimer <= 0 && this.uiManager && !this.uiManager.inGUIMode()) { // If it reaches zero, they are allowed to spawn--open menus
        this.uiManager.openClassSelect();
        this.respawning = true;
      }
    }

    // Then perform drawing (done in separate module)
  }


  public getWorld(): World {
    return this.world;
  }
  public getPlayerList(): UIPlayerInfo[] {
    return this.uiPlayerList;
  }
  public getKillFeed(): UIDeathNotification[] {
    return this.uiDeathNotifs;
  }
}
/* eslint-enable padded-blocks */

export { Client as default };