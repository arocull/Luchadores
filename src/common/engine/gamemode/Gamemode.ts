import { ScoreMethod } from '../Enums';

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
   * @param {number} soccerballs X many soccer balls are spawned, which can be used as lethal weapons, or for scoring points.
   */
  constructor(
    public name: string,
    public descript: string,
    public winScore: number,
    public teams: number = 1,
    public scoreMethod: ScoreMethod = ScoreMethod.Kills,
    public permadeath: boolean = false,
    public soccerballs: number = 0,
  ) {

  }
}

export { Gamemode as default };