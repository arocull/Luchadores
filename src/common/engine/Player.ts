import Denque from 'denque';
import Fighter from './Fighter';

class Player {
  private character: Fighter;
  private pingHistory: Denque<number>;
  private pingHistoryCapacity: number = 30; // 30 is the rule of thumb for samples (Law of Large Numbers).

  constructor(private id: string, private username: string) {
    this.character = null;
    this.pingHistory = new Denque<number>();
  }

  getUsername() {
    return this.username;
  }

  getId() {
    return this.id;
  }

  // Prevent spikes by taking a statistical approach.
  getPing() {
    if (this.pingHistory.length > 0) {
      const pingValues = this.pingHistory.toArray();
      return pingValues.reduce((accumulator, current) => accumulator + current) / pingValues.length;
    }
    return undefined;
  }

  getPingHistory() {
    return this.pingHistory;
  }

  updatePing(ping: number) {
    this.pingHistory.push(ping);

    if (this.pingHistory.length > this.pingHistoryCapacity) {
      this.pingHistory.shift();
    }
  }

  getCharacter() {
    return this.character;
  }
}

export { Player as default };
