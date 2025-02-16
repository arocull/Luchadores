import Player from '../common/engine/Player';
import { Timer } from '../common/engine/time/Time';
import { MessageBus, Topics } from '../common/messaging/bus';
import Logger from './Logger';
import World from '../common/engine/World';
import encodeWorldState from './WorldStateEncoder';
import {
  TypeEnum,
  IEvent,
  IClientConnected,
  IClientDisconnected,
  IPlayerConnect,
  IPlayerInputState,
  IPlayerSpawned,
  IPlayerListState,
} from '../common/events';
import { SubscriberContainer } from '../common/messaging/container';
import { Topics as PingPongTopics, PingInfo } from '../common/network/pingpong';
import { ConnectResponseType } from '../common/engine/Enums';
import { IPlayerConnectResponse } from '../common/events/events';
import { MapSandy } from '../common/engine/maps';

interface Action {
  player: Player;
  input: IPlayerInputState;
}

class Clockwork {
  private connections: Player[] = [];
  private world: World;
  private actions: Record<string, Action>;
  private subscribers: SubscriberContainer;

  private running: boolean = false;
  private tickRate: number;
  private publishRate: number;
  private tickTimeout: NodeJS.Timeout;
  private lastPublish: number = 0;

  constructor() {
    this.world = new World(new MapSandy());
    this.world.doReaping = true;

    this.actions = {};
    this.subscribers = new SubscriberContainer();
    this.tickRate = Math.floor(1000 / 66); // Number of milliseconds per tick (tick rate = 66 per second)
    this.publishRate = Math.floor(1000 / 20); // Number of milliseconds per world state publish
  }

  /**
   * @function tick
   * @summary Ticks the game state forward
   * @param {delta} delta Change in time since last frame
   */
  private tick(delta: number) {
    if (this.running) {
      if (delta > 0) {
        // Apply each action into the world state.
        Object.values(this.actions).forEach((act) => {
          this.world.applyAction(act.player, act.input);
        });
        this.actions = {}; // Reset the list of actions for next tick

        // Then tick the world by the tick rate for this tick
        this.world.tick(this.tickRate / 1000);

        // Is it time to publish another world state?
        const now = Timer.now();
        if ((now - this.lastPublish) >= this.publishRate) {
          this.lastPublish = now;
          this.broadcast(encodeWorldState(this.world)); // Encodes and passes the full world-state as a message

          const kills = this.world.reapKills();
          this.broadcastList(kills); // Tells players what fighters died and who to award kills to

          kills.forEach((kill) => { // First, tally kills
            Logger.debug('Character IDs %j was killed by %j', kill.characterId, kill.killerId);
            const killer = this.getPlayerWithcharacterID(kill.killerId);
            if (killer) {
              killer.earnKill();
              if (killer.getCharacter()) killer.getCharacter().EarnKill();
            }
          });
          kills.forEach((kill) => { // Then tally deaths and clear characters
            const died = this.getPlayerWithcharacterID(kill.characterId);
            if (died) {
              died.earnDeath();
              died.removeCharacter();
            }
          });

          this.updatePlayerStates(); // Update player states (tell players how much HP they have)
        }
      }

      // Kick off the interval.
      // Keep the local context by using an arrow function.
      this.tickTimeout = setTimeout(() => this.tick(this.tickRate), this.tickRate);
    }
  }

  /**
   * @function broadcast
   * @summary Sends a single message to all connected clients
   * @param {IEvent} message Message to broadcast
   */
  public broadcast(message: IEvent) {
    this.connections.forEach((conn) => MessageBus.publish(conn.getTopicSend(), message));
  }

  /**
   * @function broadcastList
   * @summary Sends a list of messages to all connected clients
   * @param {IEvent[]} messages Messages to broadcast
   */
  public broadcastList(messages: IEvent[]) {
    messages.forEach((msg) => this.broadcast(msg));
  }

  /**
   * @function updatePlayerStates
   * @summary Iterates through all players and informs them of their character ID and health
   */
  public updatePlayerStates() {
    for (let i = 0; i < this.connections.length; i++) {
      // Only sends message if their character exists though (they shouldn't need it if they don't have a character)
      const conn = this.connections[i];
      MessageBus.publish(conn.getTopicSend(), {
        type: TypeEnum.PlayerState,
        characterID: conn.getCharacterID(),
        health: conn.getCharacter() ? conn.getCharacter().HP : 0,
        jumpcooldown: conn.getCharacter() ? conn.getCharacter().jumpcooldown : 0,
      });
    }
  }
  /**
   * @summary Updates the list of players
   * @returns {number} The number of active players
   */
  public updatePlayerList(): number {
    const list = [];
    for (let i = 0; i < this.connections.length; i++) { // Build player list info
      if (this.connections[i].isReady()) {
        list.push({
          ownerId: this.connections[i].getCharacterID(),
          username: this.connections[i].getUsername(),
          kills: this.connections[i].getKills(),
          averagePing: Math.floor(this.connections[i].getPing() + 0.5),
        });
      }
    }

    for (let i = 0; i < this.connections.length; i++) { // Send to each client
      MessageBus.publish(this.connections[i].getTopicSend(), <IPlayerListState>{
        type: TypeEnum.PlayerListState,
        characterId: this.connections[i].getCharacterID(), // Individualize with player's character ID to prevent client-side duplicates
        players: list,
      });
    }

    this.world.map.updateMapSize(list.length);
    Logger.debug('Broadcasting player list, %i players left', list.length);
    return list.length;
  }

  /**
   * @function
   * @summary Gets the lowest, unused character ID
   * @returns {number} The lowest unused character ID, an integer
   * @todo Needs tests
   */
  private getLowestUnusedCharacterID(): number {
    const available = []; // Get list of all possible numbers
    for (let i = 1; i <= World.MAX_LOBBY_SIZE; i++) {
      available.push(i);
    }

    // Remove numbers that are taken
    for (let i = 0; i < this.connections.length; i++) {
      const ind = available.indexOf(this.connections[i].getCharacterID());
      if (ind !== -1) {
        available.splice(ind, 1);
      }
    }

    if (available.length === 0) return -1; // No character ID was available

    return available[0]; // Return first unused number
  }

  public getPlayerWithcharacterID(id: number): Player {
    for (let i = 0; i < this.connections.length; i++) {
      if (this.connections[i].getCharacterID() === id) return this.connections[i];
    }
    return null;
  }

  /**
   * @function verifyUsername
   * @summary Checks to make sure the given username is not already used on the server
   * @param {String} username Username to check against
   * @returns {boolean} Returns true if username is not already in use, or false otherwise
   */
  public verifyUsername(username: String): boolean {
    for (let i = 0; i < this.connections.length; i++) {
      if (this.connections[i].getUsername() === username) {
        return false; // Return false immeadietly if there is a match
      }
    }

    return true; // Return true otherwise
  }

  // Player Interaction Hooks
  busPlayerConnectHook(plr: Player, message: IPlayerConnect) {
    const valid = this.verifyUsername(message.username);

    if (!valid) {
      MessageBus.publish(plr.getTopicSend(), <IPlayerConnectResponse>{
        type: TypeEnum.PlayerConnectResponse,
        response: ConnectResponseType.DuplicateUsername,
      });

      return; // If the username was invalid, do not let them in
    }

    MessageBus.publish(plr.getTopicSend(), <IPlayerConnectResponse>{
      type: TypeEnum.PlayerConnectResponse,
      response: ConnectResponseType.Success,
    });

    plr.setUsername(message.username);

    // Broadcast a state of all player names, scores, IDs, etc; also sends clients their character IDs
    const numplrs = this.updatePlayerList();

    Logger.debug(`Initializing player with map type ${this.world.map.id}`);

    // Send world to the player
    MessageBus.publish(plr.getTopicSend(), {
      type: TypeEnum.WorldNew,
      mapId: this.world.map.id,
      numplayers: numplrs,
    });
  }
  busPlayerSpawnedHook(plr: Player, message: IPlayerSpawned) { // If they do not have a character, generate one
    if (!plr.getCharacter() || plr.getCharacter().HP <= 0) {
      plr.assignCharacter(this.world.spawnFighter(plr, message.fighterClass)); // Spawn them a fighter
    }
  }
  busPlayerInputHook(plr: Player, message: IPlayerInputState) {
    Logger.silly('Player %j InputState %j', plr.getId(), message);

    const action: Action = {
      player: plr,
      input: message,
    };

    this.pushAction(action);
  }

  // Player Setup
  busPlayerConnect(message: IClientConnected) {
    for (let i = 0; i < this.connections.length; i++) { // Make sure player doesn't already exist
      if (this.connections[i].getId() === message.id) {
        return; // Player was already present, ignore this request
      }
    }

    const player = new Player(message.id); // Create player objects
    player.assignCharacterID(this.getLowestUnusedCharacterID()); // Assign them a basic numeric ID for world-state synchronization
    player.setTopics(message.topicOutbound, message.topicInbound);

    // TODO: Move message handling responsibility directly into `Player`?
    this.subscribers.attachSpecific(message.id, player.getTopicReceive(), (msg: IEvent) => { // Hook up event for when the player sets their username
      switch (msg.type) {
        case TypeEnum.PlayerConnect:
          this.busPlayerConnectHook(player, msg);
          break;
        case TypeEnum.PlayerSpawned:
          this.busPlayerSpawnedHook(player, msg);
          break;
        case TypeEnum.PlayerInputState:
          this.busPlayerInputHook(player, msg);
          break;
        default: // Nothing
      }
    });

    // TODO: Update player pings

    // Finally, add player to the connections list because they are set up
    Logger.info(`Connected player ${message.id} and assigned character ID ${player.getCharacterID()}`);
    this.connections.push(player);
  }

  busPlayerDisconnect(message: IClientDisconnected) {
    // Unsubscribe from all event hook-ups associated with this player's id
    this.subscribers.detachAllSpecific(message.id);

    let player: Player = null; // Get the player based off of the ID
    for (let i = 0; i < this.connections.length; i++) {
      if (this.connections[i].getId() === message.id) {
        player = this.connections[i];
        this.connections.splice(i, 1);
        i--;
        break;
      }
    }

    if (player && player.getCharacter()) { // If they exist and still have a character, kill the character
      player.getCharacter().HP = -100; // Character will automatically be cleaned up by world in the next update
    }

    Logger.info(`Disconnected player ${message.id}`);
    this.updatePlayerList();
  }

  start() {
    if (!this.running) {
      this.running = true;

      // Listen for client connection events
      this.subscribers.attach(Topics.Connections, ((message: IEvent) => {
        switch (message.type) {
          case TypeEnum.ClientConnected:
            this.busPlayerConnect(message);
            break;
          case TypeEnum.ClientDisconnected:
            this.busPlayerDisconnect(message);
            break;
          default: // Nothing
        }
      }));

      // Listen for pings and update player pings when they come in
      this.subscribers.attach(PingPongTopics.PingInfo, (pingInfo: PingInfo) => {
        this.connections
          .filter((c) => c.getId() === pingInfo.id)
          .forEach((c) => c.updatePing(pingInfo.roundTripTimeMilliseconds));
      });

      this.tick(0);
    }
  }

  stop() {
    if (this.running) {
      this.running = false;

      if (this.world) { // Deconstruct world
        this.world.deconstruct();
      }
      this.subscribers.detachAll();

      clearTimeout(this.tickTimeout);
    }
  }

  pushAction(action: Action) {
    this.actions[action.player.getCharacterID()] = action;
  }

  getPlayerCount(): number {
    return this.connections.length;
  }
}

export { Clockwork as default };
