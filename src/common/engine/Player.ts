import Fighter from './Fighter';

class Player {
  private username: string;
  private kills: number; // Number of kills player has made
  private deaths: number; // Number of times player has died
  private maxStreak: number; // Largest kill streak this player has had

  public accountedFor: boolean; // Client-side only, was this player accounted for?

  private character: Fighter;
  private characterID: number; // Used for keeping track between server and clients on who is who
  private pingHistory: number[];
  private pingHistoryCapacity: number = 30; // 30 is the rule of thumb for samples (Law of Large Numbers).

  private topicSend: string;
  private topicReceive: string;
  private joined = false; // Turns true once the player has picked a username and is in-action

  constructor(private id: string) {
    this.username = 'Connecting Player';
    this.kills = 0;
    this.deaths = 0;
    this.maxStreak = 0;

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
    this.joined = true;
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
  // Remove player's character (fighter died)
  removeCharacter() {
    if (this.character) this.maxStreak = Math.max(this.character.Kills, this.maxStreak);
    this.character = null;
  }

  getCharacterID() {
    return this.characterID;
  }
  assignCharacterID(newCharacterID: number) {
    this.characterID = newCharacterID;
  }

  earnKill() {
    this.kills++;
    if (this.character) this.maxStreak = Math.max(this.character.Kills, this.maxStreak);
  }
  setKills(newKills: number) {
    this.kills = newKills;
  }
  getKills(): number {
    return this.kills;
  }
  getKillstreak(): number {
    if (this.character) return this.character.Kills;
    return 0;
  }
  getMaxKillstreak(): number {
    return this.maxStreak;
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

  isReady(): boolean {
    return this.joined;
  }
}

export { Player as default };
