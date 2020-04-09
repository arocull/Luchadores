import _ from 'lodash';
import Denque from 'denque';
import { Moment } from 'moment';
import Player from '../common/engine/Player';

// TODO: This will be replaced with a class after we figure out what this will
// look like...
//
// An example would be:
//      Maxattax tried to MOVE LEFT by 1 step at 23:59:59.999 UTC
interface Action {
  timestamp: Moment,
  player: string,
  type: string,
  value: number,
  direction: string
}

// TODO: To be replaced by class representing all physical data.
interface World {
  tick: Function
  apply: Function
}

class Clockwork {
  private connections: Array<Player> = [];
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
        let lastTime: Moment = null;
        _.each(sortedActions, (act) => {
          // Apply the action onto the world state.
          this.world.apply(act);

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

  start() {
    if (!this.running) {
      this.running = true;
      this.tick(0);
    }
  }

  stop() {
    if (this.running) {
      this.running = false;

      clearTimeout(this.loop);
    }
  }

  pushAction(action: Action) {
    this.actions.push(action);
  }
}

export { Clockwork as default };
