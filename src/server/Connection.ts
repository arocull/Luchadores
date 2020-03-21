import Denque from 'denque';

class Connection {
  public pingHistory: Denque<number>;
  private pingHistoryCapacity: number = 30; // 30 is the rule of thumb for samples (Law of Large Numbers).

  constructor(public connectionId: string, public username: string) {

  }

  updatePing(ping: number) {
    this.pingHistory.push(ping);

    if (this.pingHistory.length > this.pingHistoryCapacity) {
      this.pingHistory.shift();
    }
  }

  // Prevent spikes by taking a statistical approach.
  get ping() {
    const pingValues = this.pingHistory.toArray();
    return pingValues.reduce((accumulator, current) => accumulator + current) / pingValues.length;
  }
}

export { Connection as default };
