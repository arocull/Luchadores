import Fighter from './Fighter';

class Player {
  private username: string;
  private kills: number;
  private deaths: number;

  public accountedFor: boolean; // Client-side only, was this player accounted for?

  private character: Fighter;
  private characterID: number; // Used for keeping track between server and clients on who is who
  private pingHistory: number[];
  private pingHistoryCapacity: number = 30; // 30 is the rule of thumb for samples (Law of Large Numbers).

  private topicSend: string;
  private topicReceive: string;

  constructor(private id: string) {
    this.username = 'Player';
    this.kills = 0;
    this.deaths = 0;

    this.accountedFor = false;

    this.character = null;
    this.characterID = -1;

    this.pingHistory = [];
  }

  getUsername() {
    return this.username;
  }
  setUsername(newUsername: string) {
    this.username = newUsername;
    if (this.character != null) {
      this.character.DisplayName = newUsername;
    }
  }

  getId() {
    return this.id;
  }

  /**
   * Get the average ping of all of the available pings
   */
  getPing() {
    if (this.pingHistory.length > 0) {
      const sum = this.pingHistory.reduce((acc, x) => acc + x, 0);
      return sum / this.pingHistory.length;
    }
    return null;
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
  assignCharacter(newCharacter: Fighter) {
    this.character = newCharacter;
    this.character.DisplayName = this.username;
  }

  getCharacterID() {
    return this.characterID;
  }
  assignCharacterID(newCharacterID: number) {
    this.characterID = newCharacterID;
  }

  earnKill() {
    this.kills++;
  }
  setKills(newKills: number) {
    this.kills = newKills;
  }
  getKills(): number {
    return this.kills;
  }

  earnDeath() {
    this.deaths++;
  }
  getDeaths(): number {
    return this.deaths;
  }

  setTopics(send: string, receive: string) {
    this.topicSend = send;
    this.topicReceive = receive;
  }

  getTopicSend() {
    return this.topicSend;
  }

  getTopicReceive() {
    return this.topicReceive;
  }
}

export { Player as default };
