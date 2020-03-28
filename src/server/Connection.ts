import Denque from 'denque';

class Connection {
  private pingHistory: Denque<number>;
  private pingHistoryCapacity: number = 30; // 30 is the rule of thumb for samples (Law of Large Numbers).

  constructor(public connectionId: string, public username: string) {
    this.pingHistory = new Denque<number>();
  }

  updatePing(ping: number) {
    this.pingHistory.push(ping);

    if (this.pingHistory.length > this.pingHistoryCapacity) {
      this.pingHistory.shift();
    }
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
}

export { Connection as default };
