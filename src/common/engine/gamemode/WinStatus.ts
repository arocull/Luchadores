import Player from '../Player';
import { Team } from '../Enums';

/**
 * @class
 * @name WinStatus
 * @classdesc Result provided by the WinCondition checking function in the Gamemode object
 * @see Gamemode
 */
class WinStatus {
  /**
   * @constructor
   * @param {boolean} gameWon Is true if any win conditions are met, otherwise is false
   * @param {Player[]} winPlayers Player(s) who won, could be last man standing or people who tied for the most kills, etc
   * @param {Team} winTeam The team that won--if neutral, this should be ignored
   * @param {boolean} overtime If true, the game goes into overtime mode to break the tie
   */
  constructor(
    public gameWon: boolean = false,
    public winPlayers: Player[] = [],
    public winTeam: Team = Team.Neutral,
    public overtime: boolean = false,
  ) {

  }
}

export { WinStatus as default };