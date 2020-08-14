import Fighter from './Fighter';
import { Team } from './Enums';

class Player {
  private username: string;
  private kills: number; // Number of kills player has made
  private deaths: number; // Number of times player has died
  private maxStreak: number; // Largest kill streak this player has had
  private score: number;
  private team: Team;

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
    this.maxStreak = 0;
    this.score = 0;
    this.team = Team.Neutral;

    this.accountedFor = false;

    this.character = null;
    this.characterID = 0;

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
    this.character.Team = this.team;
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
  resetKillstreak() {
    this.maxStreak = 0;
  }

  earnScore(points: number = 1) {
    this.score += points;
  }
  setScore(newScore: number) {
    this.score = newScore;
  }
  getScore() {
    return this.score;
  }

  earnDeath() {
    this.deaths++;
  }
  setDeaths(newDeaths: number) {
    this.deaths = newDeaths;
  }
  getDeaths(): number {
    return this.deaths;
  }

  resetStats() {
    this.setKills(0);
    this.resetKillstreak();
    this.setDeaths(0);
    this.setScore(0);
  }

  getTeam(): Team {
    return this.team;
  }
  assignTeam(newTeam: Team) {
    this.team = newTeam;
    if (this.character) this.character.Team = this.team;
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
