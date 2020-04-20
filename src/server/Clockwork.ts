import _ from 'lodash';
import Denque from 'denque';
import Player from '../common/engine/Player';
import { now } from '../common/engine/Time';
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
} from '../common/events';
import { SubscriberContainer } from '../common/messaging/container';
import { Topics as PingPongTopics, PingInfo } from '../common/network/pingpong';

interface Action {
  player: Player;
  input: IPlayerInputState;
  timestamp: number;
}

class Clockwork {
  private connections: Player[] = [];
  private world: World;
  private running: boolean = false;
  private tickRate: number;
  private actions: Denque<Action>;
  private loop: NodeJS.Timeout;
  private subscribers: SubscriberContainer;

  constructor() {
    this.world = new World();
    this.world.doReaping = true;

    this.actions = new Denque<Action>();
    this.subscribers = new SubscriberContainer();
    this.tickRate = 1000 / 20; // Number of milliseconds per tick (tick rate = 20 per second)
  }

  tick(delta: number) {
    this.loop = null;

    if (this.running) {
      if (delta > 0) {
        const actionArray = this.actions.toArray();
        this.actions.clear(); // Reset the list of actions for next tick

        const sortedActions = _.sortBy(actionArray, (act) => act.timestamp);
        const span = sortedActions.length > 0
          ? _.last(sortedActions).timestamp - _.first(sortedActions).timestamp
          : 0;

        // We're going to line the actions in the order they fired, apply each
        // to the world state, and tick the physics by the amount of time
        // between each action.
        let lastTime = 0;
        _.each(sortedActions, (act) => {
          // Apply the action onto the world state.
          this.world.applyAction(act.player, act.input);

          if (lastTime) {
            // Tick the world by the difference in time between the actions.
            this.world.tick((lastTime - act.timestamp) / 1000);
          }

          lastTime = act.timestamp;
        });

        // Get remainder time
        const remainder = this.tickRate - span;
        this.world.tick(remainder / 1000); // Decimal seconds
        // Logger.debug('Ticked %o actions at %o with remainder %o', actionArray.length, Date.now(), remainder);

        // Finally, update world state for all clients
        this.broadcast(encodeWorldState(this.world)); // Encodes and passes the full world-state as a message
        this.broadcastList(this.world.reapKills()); // Tells players what fighters died and who to award kills to
        this.updatePlayerStates(); // Update player states (tell players how much HP they have)
      }

      // Kick off the interval.
      // Keep the local context by using an arrow function.
      this.loop = setTimeout(() => this.tick(this.tickRate), this.tickRate);
    }
  }

  public broadcast(message: IEvent) {
    this.connections.forEach((conn) => MessageBus.publish(conn.getTopicSend(), message));
  }

  public broadcastList(messages: IEvent[]) {
    messages.forEach((msg) => this.broadcast(msg));
  }

  public updatePlayerStates() { // Iterates through all players and informs them of their character ID and health
    for (let i = 0; i < this.connections.length; i++) {
      // Only sends message if their character exists though (they shouldn't need it if they don't have a character)
      const conn = this.connections[i];
      const char = conn.getCharacter();
      if (char && char.HP > 0) {
        MessageBus.publish(conn.getTopicSend(), {
          type: TypeEnum.PlayerState,
          characterID: conn.getCharacterID(),
          health: char.HP,
        });
      }
    }
  }

  // TODO: Needs tests?
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

  // Player Interaction Hooks
  busPlayerConnectHook(plr: Player, message: IPlayerConnect) {
    plr.setUsername(message.username);

    // Broadcast the username to all clients, they will all receive a message of "player joined the game"
    this.broadcast(<IPlayerConnect>{
      type: TypeEnum.PlayerConnect,
      ownerId: plr.getCharacterID(), // Sync ID down to client's world state
      username: message.username,
    });

    // Broadcast an initial state of all player names on new connection
    for (let i = 0; i < this.connections.length; i++) {
      MessageBus.publish(plr.getTopicSend(), <IPlayerConnect>{
        type: TypeEnum.PlayerConnect,
        ownerId: this.connections[i].getCharacterID(),
        username: this.connections[i].getUsername(),
      });
    }
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
      timestamp: now(),
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

    MessageBus.publish(player.getTopicSend(), { // Update client-side player ID
      type: TypeEnum.PlayerState,
      characterID: player.getCharacterID(),
      health: 0, // No character yet, just say they have 0 HP
    });

    // TODO: Update player pings

    // Finally, add player to the connections list because they are set up
    Logger.info(`Connected player ${message.id}`);
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

      this.subscribers.detachAll();

      clearTimeout(this.loop);
    }
  }

  pushAction(action: Action) {
    this.actions.push(action);
  }
}

export { Clockwork as default };
