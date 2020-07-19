enum EntityType {
  Fighter = 0,
  Projectile = 1,
  Particle = 2,
  Prop = 3,
}

enum FighterType {
  Sheep = 0,
  Deer = 1,
  Flamingo = 2,
  Toad = 3,

  None = -1,
}

enum ProjectileType {
  Bullet = 0,
  Fire = 1,
}

enum ParticleType {
  Confetti = 0,
  RosePetal = 1,
  SmashEffect = 2,
  Fire = 3,
  Smoke = 4,
  Lightning = 5,
  BulletFire = 6,
  BulletShell =7,
}

enum ColliderType {
  Cylinder = 0,
  Prism = 1,
}

enum MapPreset {
  Sandy = 0,
  Grassy = 1,
}

enum UIFrameType {
  Basic = 0,
  Text = 1,
  DeathNotification = 2,
  PlayerInfo = 3,
}

enum RenderQuality {
  Low = 1,
  Medium = 2,
  High = 3,
}


/**
 * @enum {number}
 * @name ScoreMethod
 * @summary Used for determining how points are scored in a gamemode.
 */
enum ScoreMethod {
  /** Kills are counted directly towards score */
  Kills = 0,
  /** Time spent on the hill or in a zone is counted towards score */
  Zone = 1,
  /** Making goals with soccer balls are counted towards score */
  Goals = 2,
}

/**
 * @enum {number}
 * @name Team
 * @summary Used for identifying what team a player is on.
 */
enum Team {
  Neutral = 0,
  Red = 1,
  Blue = 2,
  Green = 3,
  Yellow = 4,
}

/**
 * @enum {number}
 * @name GamePhase
 * @summary Game
 */
enum GamePhase {
  /** Freeplay - No special player management occurs here--join, fight, and play as you like */
  Freeplay = 0,
  /** Join Phase - Server waits for players to join here. Acts like freeplay, but points are cleared at end of phase.
   * Bots populate server near end of period. */
  Join = 1,
  Setup = 2,
  Battle = 3,
  /** Round Finish - End of round. Displays leaderboard, player inputs ignored. */
  RoundFinish = 4,
}


// Functions
const FighterTypeStrings = [
  'Sheep',
  'Deer',
  'Flamingo',
  'Toad',
];
function fighterTypeToString(type: FighterType) {
  return FighterTypeStrings[type];
}

const TeamColors = [
  '#000000',
  '#df0000',
  '#0033df',
  '#00ef33',
  '#ffec00',
];
function getTeamColor(type: Team) {
  return TeamColors[type];
}


export {
  EntityType,
  FighterType,
  ProjectileType,
  ParticleType,
  ColliderType,
  MapPreset,
  UIFrameType,
  RenderQuality,
  ScoreMethod,
  Team,
  GamePhase,
  fighterTypeToString,
  getTeamColor,
};
