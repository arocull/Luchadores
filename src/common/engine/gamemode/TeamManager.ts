import { Team } from '../Enums';
import Player from '../Player';

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

  public static assignTeams(players: Player[], numTeams: number) {
    const randomPlayers: Player[] = players.slice(); // Create duplicate array of players

    randomPlayers.sort(() => Math.random() - 0.5); // Shuffle array randomly

    // Assign teams
    if (numTeams <= 1) { // If there is only one team or less, assign everyone to neutral
      for (let i = 0; i < randomPlayers.length; i++) {
        randomPlayers[i].assignTeam(Team.Neutral);
      }
    } else {
      for (let i = 0; i < randomPlayers.length; i++) {
        // Assign team based off of index
        // So if there were 4 teams and index was 4, i % numTeams would be 0 (neutral), and one is added so there is a team
        // If there were 4 teams and the index was 3, i % numTeams would be 3 (green), and +1 is 4 so they are team yellow
        randomPlayers[i].assignTeam((i % numTeams) + 1);
      }
    }
  }
}

export { TeamManager as default };