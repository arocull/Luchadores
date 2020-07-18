import { Team } from '../Enums';

/**
 * @class
 * @name TeamManager
 * @classdesc Used for solving disputes on scores, damage, etc
 */
class TeamManager {
  /**
   * @function isTeammate
   * @summary Checks to see if a fighter is on the same team as the other
   * @param {Team} a Team of Fighter 1
   * @param {Team} b Team of Fighter 2
   * @returns {boolean} Returns true if the two fighters are on the same team
   */
  public static isTeammate(a: Team, b: Team): boolean {
    return (a === b && a !== Team.Neutral);
  }
}

export { TeamManager as default };