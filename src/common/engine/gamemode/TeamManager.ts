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

  /**
   * @function assignTeams
   * @summary Distributes a list of players among a set number of teams, or assigns them to neutral if there is only 1 team or less
   * @param {Player[]} players List of players to distribute between teams
   * @param {number} numTeams Number of teams
   */
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

  /**
   * @function assignTeam
   * @summary Assigns the given player to the team with the lowest amount of players
   * @param {Player} player Player to assign to a team
   * @param {Player[]} players Current list of players (used for counting teams)
   * @param {numbeR} numTeams Number of teams used in this gamemode
   */
  public static assignTeam(player: Player, players: Player[], numTeams: number) {
    if (numTeams <= 1) { // If there is one team or less, default to neutral
      player.assignTeam(Team.Neutral);
      return;
    }

    // There are only four teams by default--not all of these will be filled
    const teams: number[] = this.tally(players);

    // Find the team with the least amount of players (if all teams are equal, defaults to the first team)
    let min = 1000;
    let minIndex = 0;
    for (let i = 0; i < numTeams; i++) { // Make sure we do not check teams that are not in use
      if (teams[i] < min) {
        min = teams[i];
        minIndex = i;
      }
    }

    player.assignTeam(minIndex + 1); // Assigns team to the minimum
  }


  /**
   * @function tally
   * @summary Returns the number of players on the given teams
   * @param {Player[]} players Players to tally
   */
  public static tally(players: Player[]): number[] {
    // There are only four teams by default--not all of these will be filled
    const teams: number[] = [0, 0, 0, 0];
    // Tally how many players are on each team
    for (let i = 0; i < players.length; i++) {
      if (players[i].getTeam() !== Team.Neutral) { // Don't tally neutrals
        teams[players[i].getTeam() - 1]++;
      }
    }

    return teams;
  }

  /**
   * @function tallyKills
   * @summary Returns the kill counts of all given teams
   * @param {Player[]} players Players to tally kills from
   */
  public static tallyKills(players: Player[]): number[] {
    // There are only four teams by default--not all of these will be filled
    const teams: number[] = [0, 0, 0, 0];
    // Tally how many kills are on each team
    for (let i = 0; i < players.length; i++) {
      if (players[i].getTeam() !== Team.Neutral) { // Don't tally neutrals
        teams[players[i].getTeam() - 1] += players[i].getKills();
      }
    }

    return teams;
  }

  /**
   * @function tallyScore
   * @summary Returns the score of all given teams
   * @param {Player[]} players Players to tally score from
   */
  public static tallyScore(players: Player[]): number[] {
    // There are only four teams by default--not all of these will be filled
    const teams: number[] = [0, 0, 0, 0];
    // Tally how many points scored are on each team
    for (let i = 0; i < players.length; i++) {
      if (players[i].getTeam() !== Team.Neutral) { // Don't tally neutrals
        teams[players[i].getTeam() - 1] += players[i].getScore();
      }
    }

    return teams;
  }

  /**
   * @function tallyLiving
   * @summary Returns the number of living players on the given teams
   * @param {Player[]} players Players to tally
   */
  public static tallyLiving(players: Player[]): number[] {
    // There are only four teams by default--not all of these will be filled
    const teams: number[] = [0, 0, 0, 0];
    // Tally how many living players are on each team
    for (let i = 0; i < players.length; i++) {
      if (players[i].getTeam() !== Team.Neutral && players[i].getCharacter() && players[i].getCharacter().HP > 0) { // Don't tally neutrals or dead
        teams[players[i].getTeam() - 1]++;
      }
    }

    return teams;
  }
}

export { TeamManager as default };