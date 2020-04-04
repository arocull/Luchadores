import _ from 'lodash';
import Denque from 'denque';
import * as Moment from 'moment'; // NOTE: this is a namespace, it contains the Moment type under it.
import Player from '../common/engine/Player';
import { MessageBus, Topics } from '../common/messaging/bus';
import Logger from './Logger';
import World from '../common/engine/World';
import { IPlayerInputState } from '../common/events/index';

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
      }

      // Kick off the interval.
      // Keep the local context by using an arrow function.
      this.loop = setTimeout(() => this.tick(worstPing), worstPing);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  busPlayerInputHook(message: IPlayerInputState) {
    Logger.info('%j', message);

    // TODO: Get the player from the connection / message bus.
    const action: Action = {
      player: null,
      timestamp: Moment.utc(),
      input: message,
    };

    this.pushAction(action);
  }

  start() {
    if (!this.running) {
      this.running = true;
      // TODO: How do I separate out my messages?
      MessageBus.subscribe(Topics.ServerNetworkFromClient, this.busPlayerInputHook);
      this.tick(0);
    }
  }

  stop() {
    if (this.running) {
      this.running = false;
      MessageBus.unsubscribe(Topics.ServerNetworkFromClient, this.busPlayerInputHook);

      clearTimeout(this.loop);
    }
  }

  pushAction(action: Action) {
    this.actions.push(action);
  }
}

export { Clockwork as default };
