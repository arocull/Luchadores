import Gamemode from './Gamemode';
// eslint-disable-next-line import/no-cycle
import TeamManager from './TeamManager';
import { ScoreMethod } from '../Enums';

/**
 * @enum {number}
 * @name GamemodeType
 * @summary Gamemode presets handled as an enum for easy transferring.
 */
enum GamemodeType {
  /** Deathmatch - First player to 20 kills wins */
  Deathmatch = 0,
  /** Team Deathmatch - First team to 40 kills wins */
  TeamDeathmatch = 1,
  /** Skirmish - Last luchador standing wins */
  Skirmish = 2,
  /** Team Skirmish - Last team standing wins */
  TeamSkirmish = 3,
  /** Zone Control - One player must hold control of the zone for 30 seconds */
  ZoneControl = 4,
  /** Team Zone Control - One team must hold control of the zone for 90 seconds */
  TeamZoneControl = 5,
  /** Soccer - Two teams compete in a lethal game of soccer. First team to 5 goals wins */
  Soccer = 6,
  /** Custom - Start with basic deathmatch rules and can be uniquely configured by player */
  Custom = 7,
}

/**
 * @function MakeGamemode
 * @summary Loads a gamemode given a preset
 * @param {GamemodeType} preset Preset to follow
 */
function MakeGamemode(preset: GamemodeType) {
  switch (preset) {
    case GamemodeType.Deathmatch: default: // Deathmatch is default gamemode
      return new Gamemode('Deathmatch', 'First luchador to 20 kills wins', 20, 1, ScoreMethod.Kills, false, 0);
    case GamemodeType.TeamDeathmatch:
      return new Gamemode('Team Deathmatch', 'First team to 40 kills wins', 40, 2, ScoreMethod.Kills, false, 0);
    case GamemodeType.Skirmish:
      return new Gamemode('Skirmish', 'Last luchador standing wins', 0, 1, ScoreMethod.Kills, true, 0);
    case GamemodeType.TeamSkirmish:
      return new Gamemode('Team Skirmish', 'Last team standing wins', 0, 2, ScoreMethod.Kills, true, 0);
    case GamemodeType.ZoneControl:
      return new Gamemode('Zone Control', 'One luchador must hold the zone for a total of 30 seconds', 30, 1, ScoreMethod.Zone, false, 0);
    case GamemodeType.TeamZoneControl:
      return new Gamemode('King of the Hill', 'One team must hold the zone for a total of 90 seconds', 90, 2, ScoreMethod.Zone, false, 0);
    case GamemodeType.Soccer:
      return new Gamemode('Luchador Ball', 'A lethal game of soccer, first team to 5 goals wins', 5, 2, ScoreMethod.Goals, false, 1);
    case GamemodeType.Custom:
      return new Gamemode('Custom', 'A customly configurable gamemode!', 20, 1, ScoreMethod.Kills, false, 0);
  }
}

export {
  GamemodeType,
  Gamemode,
  TeamManager,
  MakeGamemode,
};