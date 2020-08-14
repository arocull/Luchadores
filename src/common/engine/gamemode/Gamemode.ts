import { Team, ScoreMethod } from '../Enums';
import Player from '../Player';
import WinStatus from './WinStatus';
import TeamManager from './TeamManager';

/**
 * @class
 * @name Gamemode
 * @classdesc Class that holds a rulesets and functionality for a given gamemode
 */
class Gamemode {
  /** Array used to keep track of zone points or goal scores for each team in a global sense */
  private teamScores: number[];

  /**
   * @constructor
   * @param {string} name Name of the gamemode. Generic and straightforward.
   * @param {string} descript Description of the gamemode. Should explain basic rules.
   * @param {number} winScore Score required for a win. Set to 0 if you do not want score to be a win condition (i.e. no win condition or skirmish)
   * @param {number} teams Number of teams players are to be distributed amongst. Set to 1 or 0 for no teams.
   * @param {ScoreMethod} scoreMethod Primary method of earning points. Different values will also effect the map in certain ways,
   * such as generating control zones or soccer goals.
   * @param {boolean} permadeath If this is true, players do not respawn after death. Automatically enables a last-man-standing win condition.
   * @param {number} time How long the battle phase in this gamemode lasts. Set to zero for unlimited.
   * @param {number} soccerballs X many soccer balls are spawned, which can be used as lethal weapons, or for scoring points.
   */
  constructor(
    private _name: string,
    private _descript: string,
    private _winScore: number,
    private _teams: number = 1,
    private _scoreMethod: ScoreMethod = ScoreMethod.Kills,
    private _permadeath: boolean = false,
    private _time: number = 300,
    private _soccerballs: number = 0,
  ) {
    // Set up array to be dynamically sized with the number of teams there are
    this.teamScores = [];
    for (let i = 0; i < _teams; i++) {
      this.teamScores.push(0);
    }
  }

  // Getters
  public get name(): string {
    return this._name;
  }
  public get descript(): string {
    return this._descript;
  }
  public get winScore(): number {
    return this._winScore;
  }
  public get teams(): number {
    return this._teams;
  }
  public get scoreMethod(): ScoreMethod {
    return this._scoreMethod;
  }
  public get permadeath(): boolean {
    return this._permadeath;
  }
  public get time(): number {
    return this._time;
  }
  public get soccerballs(): number {
    return this._soccerballs;
  }

  /**
   * @function scorePoint
   * @summary Scores X many points for the given team
   * @param {Team} team The team to score the point for
   * @param {number} points The amount of points to score (defaults to 1)
   */
  public scorePoint(team: Team, points: number = 1) {
    if (team > this._teams) return;
    this.teamScores[team - 1] += points;
  }

  /**
   * @function checkWinCondition
   * @summary Compares scores of all players and who is alive to tell if the game has been won or not
   * @param {Player[]} players Player list to check win condition with
   */
  public checkWinCondition(players: Player[]): WinStatus {
    if (players.length <= 0) return new WinStatus();
    const status = new WinStatus();

    // Check team victory conditions
    if (this._teams > 1) {
      let scores: number[];

      switch (this._scoreMethod) {
        case ScoreMethod.Kills: // Kills are tracked independently and separate from score
        default:
          scores = TeamManager.tallyKills(players);
          break;
        case ScoreMethod.Goals: // Goals are tracked per-player rather than per-team
          scores = TeamManager.tallyScore(players);
          break;
        case ScoreMethod.Zone: // Zone is tracked per-team to prevent score stacking
          scores = this.teamScores;
      }

      // Find team with highest score--look out for ties which may induce overtime--round score down to nearest second or point
      let maxScore = 0;
      let maxScoreIndex = 0;
      let matches = 0;
      for (let i = 0; i < this._teams; i++) {
        if (scores[i] > maxScore) {
          maxScore = scores[i];
          maxScoreIndex = i;
          matches = 0; // New highest score found--reset the ties
        } else if (Math.floor(scores[i]) === Math.floor(maxScore) && Math.floor(maxScore) > 0) { // Count ties (if max score is not zero)
          matches++;
        }
      }

      // If there is a tie for the highest score, force overtime
      if (matches > 0) return new WinStatus(false, [], Team.Neutral, true);

      if (maxScore >= this._winScore && this._winScore > 0) {
        status.gameWon = true;
        status.winTeam = maxScoreIndex + 1;
        for (let i = 0; i < players.length; i++) { // List all players on the winning team
          if (players[i].getTeam() === status.winTeam) {
            status.winPlayers.push(players[i]);
          }
        }
      }

      // Team permadeath
      if (this._permadeath) {
        const living: number[] = TeamManager.tallyLiving(players);
        let zeroes = 0; // Keep track of how many teams are eliminated
        for (let i = 0; i < this._teams; i++) {
          if (living[i] === 0) zeroes++;
        }
        if (zeroes >= this._teams - 1) { // If all other teams are dead
          for (let i = 0; i < this._teams; i++) {
            if (living[i] > 0) { // Select team with players remaining
              status.gameWon = true;
              status.winTeam = i + 1;
              break;
            }
          }

          for (let i = 0; i < players.length; i++) { // List all remaining players on the winning team
            if (players[i].getTeam() === status.winTeam && players[i].getCharacter() && players[i].getCharacter().HP) {
              status.winPlayers.push(players[i]);
            }
          }
        }
      }
    } else { // Game with no teams
      let winningPlayer: Player = players[0];
      let winningScore = 0;

      // Look for player with highest score (kills are tracked separately from score)
      switch (this.scoreMethod) {
        case ScoreMethod.Kills:
          for (let i = 1; i < players.length; i++) {
            if (players[i].getKills() > winningPlayer.getKills()) winningPlayer = players[i];
          }
          winningScore = winningPlayer.getKills();
          break;
        default:
          for (let i = 1; i < players.length; i++) {
            if (players[i].getScore() > winningPlayer.getScore()) winningPlayer = players[i];
          }
          winningScore = winningPlayer.getScore();
      }

      // See if player's score is higher or equal to win condition
      if (winningScore >= this.winScore && this.winScore > 0) status.gameWon = true;

      // If this is a perma-death gamemode, end it if only one person is left
      if (this.permadeath) {
        let alive = 0;
        for (let i = 1; i < players.length; i++) {
          if (players[i].getCharacter() && players[i].getCharacter().HP > 0) alive++;
        }

        if (alive <= 1) { // If only one player if left, reassign winner to last person standing (if one exists)
          winningPlayer = null;
          for (let i = 1; i < players.length && !winningPlayer; i++) {
            if (players[i].getCharacter() && players[i].getCharacter().HP > 0) winningPlayer = players[i];
          }
          status.gameWon = true;
        }
      }

      if (status.gameWon && winningPlayer) {
        status.winPlayers = [winningPlayer];
      }
    }

    return status;
  }
}

export { Gamemode as default };