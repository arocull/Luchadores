import _ from 'lodash';
import Denque from 'denque';
import Player from '../common/engine/Player';
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

interface Action {
  player: Player;
  input: IPlayerInputState;
  timestamp: number;
}

class Clockwork {
  private connections: Player[] = [];
  private world: World;
  private running: boolean = false;
  private actions: Denque<Action>;
  private loop: NodeJS.Timeout;
  private subscribers: SubscriberContainer;

  constructor() {
    this.world = new World();
    this.world.doReaping = true;

    this.actions = new Denque<Action>();
    this.subscribers = new SubscriberContainer();
  }

  tick(delta: number) {
    this.loop = null;

    if (this.running) {
      // const pings: number[] = [];
      // _.each(this.connections, (conn) => {
      //   pings.push(conn.getPing());
      // });

      // Worst of *average* pings! This way we even the playing field so the
      // player with fiber doesn't whoop on the guy with dialup.
      const worstPing = 100; // _.max(pings);

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
        const remainder = worstPing - span;
        this.world.tick(remainder / 1000); // Decimal seconds

        // Finally, update world state for all clients
        this.broadcast(encodeWorldState(this.world)); // Encodes and passes the full world-state as a message
        this.broadcastList(this.world.reapKills()); // Tells players what fighters died and who to award kills to
        this.updatePlayerStates(); // Update player states (tell players how much HP they have)
      }

      // Kick off the interval.
      // Keep the local context by using an arrow function.
      this.loop = setTimeout(() => this.tick(worstPing), worstPing);
    }
  }

  public broadcast(message: IEvent) {
    for (let i = 0; i < this.connections.length; i++) {
      MessageBus.publish(`server-to-client-${this.connections[i].getId()}`, message);
    }
  }
  public broadcastList(messages: IEvent[]) {
    for (let i = 0; i < messages.length; i++) {
      this.broadcast(messages[i]);
    }
  }
  public updatePlayerStates() { // Iterates through all players and informs them of their character ID and health
    for (let i = 0; i < this.connections.length; i++) {
      // Only sends message if their character exists though (they shouldn't need it if they don't have a character)
      const char = this.connections[i].getCharacter();
      if (char && char.HP > 0) {
        MessageBus.publish(`server-to-client-${this.connections[i].getId()}`, {
          type: TypeEnum.PlayerState,
          characterID: this.connections[i].getCharacterID(),
          health: char.HP,
        });
      }
    }
  }

  // TODO: Needs tests?
  private getLowestUnusedCharacterID(): number {
    // iterates over character IDs (generated from map)
    // comparing against previous (accumulator),
    // starting with World.MAX_LOBBY_SIZE (seed value)
    return this.connections
      .map((conn) => conn.getCharacterID())
      .reduce((acc, id) => {
        if (id < acc) {
          return id;
        }
        return acc;
      }, World.MAX_LOBBY_SIZE);
  }

  // Player Interaction Hooks
  busPlayerConnectHook(plr: Player, message: IPlayerConnect) {
    plr.setUsername(message.username);

    this.broadcast(message); // Broadcast the username to all clients, they will all recieve a message of "player joined the game"
  }
  busPlayerSpawnedHook(plr: Player, message: IPlayerSpawned) { // If they do not have a character, generate one
    if (!plr.getCharacter()) {
      plr.assignCharacter(this.world.spawnFighter(plr, message.fighterClass)); // Spawn them a fighter
    }
  }
  busPlayerInputHook(plr: Player, message: IPlayerInputState) {
    Logger.silly('Player %j InputState %j', plr.getId(), message);

    const action: Action = {
      player: plr,
      timestamp: Date.now(),
      input: message,
    };

    this.pushAction(action);
  }

  // Player Setup
  busPlayerConnect(message: IClientConnected) {
    if (message.type !== TypeEnum.ClientConnected) {
      return;
    }

    for (let i = 0; i < this.connections.length; i++) { // Make sure player doesn't already exist
      if (this.connections[i].getId() === message.id) {
        return; // Player was already present, ignore this request
      }
    }

    const player = new Player(message.id); // Create player objects
    player.assignCharacterID(this.getLowestUnusedCharacterID()); // Assign them a basic numeric ID for world-state synchronization

    // TODO: Move message handling responsibility directly into `Player`?
    this.subscribers.attachSpecific(message.id, message.topicInbound, (msg: IEvent) => { // Hook up event for when the player sets their username
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

    MessageBus.publish(message.topicOutbound, { // Update client-side player ID
      type: TypeEnum.PlayerState,
      characterID: player.getCharacterID(),
      health: 0, // No character yet, just say they have 0 HP
    });

    // TODO: Update player pings

    Logger.info(`Connected player ${message.id}`);

    this.connections.push(player); // Finally, add player to the connections list because they are set up
  }

  busPlayerDisconnect(message: IClientDisconnected) {
    if (message.type !== TypeEnum.ClientDisconnected) {
      return;
    }

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
