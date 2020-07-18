import Gamemode from './Gamemode';
import { ScoreMethod } from '../Enums';

/**
 * @class
 * @name Deathmatch
 * @classdesc Gamemode preset--first luachdor to 20 kills wins.
 */
class Deathmatch extends Gamemode {
  constructor() {
    super('Deathmatch', 'First luchador to 20 kills wins', 20, 1, ScoreMethod.Kills, false, 0);
  }
}

export { Deathmatch as default };