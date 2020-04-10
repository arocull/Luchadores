import _ from 'lodash';
import Denque from 'denque';
import * as Moment from 'moment'; // NOTE: this is a namespace, it contains the Moment type under it.
import Player from '../common/engine/Player';
import { MessageBus, Topics } from '../common/messaging/bus';
import Logger from './Logger';
import World from '../common/engine/World';
import encodeWorldState from './WorldStateEncoder';
import { IPlayerInputState, TypeEnum, IEvent } from '../common/events/index';
import {
  IPlayerSpawned, IClientConnect, IClientDisconnect, IPlayerConnect,
} from '../common/events/events';

interface Action {
  player: Player;
  input: IPlayerInputState;
  timestamp: Moment.Moment;
}

class Clockwork {
  private connections: Player[] = [];
  private world: World;
  private running: boolean = false;
  private actions: Denque<Action>;
  private loop: NodeJS.Timeout;

  tick(delta: number) {
    this.loop = null;

    if (this.running) {
      const pings: number[] = [];
      _.each(this.connections, (conn) => {
        pings.push(conn.getPing());
      });

      // Worst of *average* pings! This way we even the playing field so the
      // player with fiber doesn't whoop on the guy with dialup.
      const worstPing = _.max(pings);

      if (delta > 0) {
        const sortedActions = _.sortBy(this.actions.toArray(), (act) => act.timestamp);

        // We're going to line the actions in the order they fired, apply each
        // to the world state, and tick the physics by the amount of time
        // between each action.
        let lastTime: Moment.Moment = null;
        _.each(sortedActions, (act) => {
          // Apply the action onto the world state.
          this.world.applyAction(act.player, act.input);

          if (lastTime) {
            // Tick the world by the difference in time between the actions.
            this.world.tick(lastTime.diff(act.timestamp));
          }

          lastTime = act.timestamp;
        });

        this.world.tick(lastTime.diff(delta));

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

  private getLowestUnusedCharacterID(): number {
    let id = 1;
    let interfered = false;
    while (id <= World.MAX_LOBBY_SIZE) {
      for (let i = 0; i < this.connections.length; i++) {
        if (id === this.connections[i].getCharacterID()) {
          interfered = true;
          id++;
        }
      }

      if (!interfered) return id;
    }

    return id;
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
    Logger.info('Player %j InputState %j', plr.getId(), message);

    const action: Action = {
      player: plr,
      timestamp: Moment.utc(),
      input: message,
    };

    this.pushAction(action);
  }


  // Player Setup
  busPlayerConnect(message: IClientConnect) {
    if (message.type !== TypeEnum.ClientConnect) return;

    for (let i = 0; i < this.connections.length; i++) { // Make sure player doesn't already exist
      if (this.connections[i].getId() === message.id) {
        return; // Player was already present, ignore this request
      }
    }

    const player = new Player(message.id); // Create player objects
    player.assignCharacterID(this.getLowestUnusedCharacterID()); // Assign them a basic numeric ID for world-state synchronization

    // TODO: Implement topic names into connection events
    // TODO: Make message bus return a consumer upon subscription
    MessageBus.subscribe(`server-from-client-${message.id}`, (msg: IEvent) => { // Hook up event for when the player sets their username
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

    MessageBus.publish(`server-to-client-${message.id}`, { // Update client-side player ID
      type: TypeEnum.PlayerState,
      characterID: player.getCharacterID(),
      health: 0, // No character yet, just say they have 0 HP
    });

    Logger.info(`Connected player ${message.id}`);

    this.connections.push(player); // Finally, add player to the connections list because they are set up
  }
  busPlayerDisconnect(message: IClientDisconnect) {
    if (message.type !== TypeEnum.ClientDisconnect) return;

    // Unsubscribe from all event hook-ups on this player's topic specifically
    const subscribers: any[] = MessageBus.subscribers(`server-from-client-${message.id}`);
    for (let i = 0; i < subscribers.length; i++) {
      MessageBus.unsubscribe(`server-from-client-${message.id}`, subscribers[i]);
    }

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
      this.world = new World();
      this.world.doReaping = true;

      this.running = true;

      MessageBus.subscribe(Topics.Connections, this.busPlayerConnect);
      MessageBus.subscribe(Topics.Connections, this.busPlayerDisconnect);

      this.tick(0);
    }
  }

  stop() {
    if (this.running) {
      this.running = false;
      MessageBus.unsubscribe(Topics.Connections, this.busPlayerConnect);

      clearTimeout(this.loop);
    }
  }

  pushAction(action: Action) {
    this.actions.push(action);
  }
}

export { Clockwork as default };
