import { ScoreMethod } from '../Enums';
import Player from '../Player';
import { MessageBus } from '../../messaging/bus';

/**
 * @class
 * @name Gamemode
 * @classdesc Class that holds a rulesets for a given gamemode.
 */
class Gamemode {
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
    public name: string,
    public descript: string,
    public winScore: number,
    public teams: number = 1,
    public scoreMethod: ScoreMethod = ScoreMethod.Kills,
    public permadeath: boolean = false,
    public time: number = 300,
    public soccerballs: number = 0,
  ) {

  }

  public checkWinCondition(players: Player[]): boolean {
    if (players.length <= 0) return false;
    let winConditionMet = false;

    if (this.teams <= 1) {
      let winningPlayer: Player = players[0];
      let winningScore = 0;

      // Look for player with highest score
      if (this.scoreMethod === ScoreMethod.Kills) {
        for (let i = 1; i < players.length; i++) {
          if (players[i].getKills() > winningPlayer.getKills()) winningPlayer = players[i];
        }

        winningScore = winningPlayer.getKills();
      } else {
        for (let i = 1; i < players.length; i++) {
          if (players[i].getScore() > winningPlayer.getScore()) winningPlayer = players[i];
        }

        winningScore = winningPlayer.getScore();
      }

      // See if player's score is higher or equal to win condition
      if (winningScore >= this.winScore && this.winScore > 0) winConditionMet = true;

      // If this is a perma-death gamemode, end it if only one person is left
      if (this.permadeath) {
        let alive = 0;
        for (let i = 1; i < players.length; i++) {
          if (players[i].getCharacter() && players[i].getCharacter().HP > 0) alive++;
        }

        if (alive <= 1) { // If only one player, reassign winner to last person standing (if one exists)
          winningPlayer = null;
          for (let i = 1; i < players.length && !winningPlayer; i++) {
            if (players[i].getCharacter() && players[i].getCharacter().HP > 0) winningPlayer = players[i];
          }
          winConditionMet = true;
        }
      }

      if (winConditionMet && winningPlayer) {
        // TODO: Make title broadcast to clients
        MessageBus.publish('Title', `${winningPlayer.getUsername()} has won!`);
      }
    }

    return winConditionMet;
  }
}

export { Gamemode as default };