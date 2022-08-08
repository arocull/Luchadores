enum EntityType {
  Fighter = 0,
  Projectile = 1,
  Particle = 2,
  Prop = 3,
  Group = 4,
}

enum FighterType {
  Sheep = 0,
  Deer = 1,
  Flamingo = 2,

  None = -1,
}

enum ConstraintType {
  Suplex = 0,

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
  BulletShell = 7,
  MoveDash = 8,
  Shockwave = 9,
  Snowfall = 10,
  LandingDust = 11,
  LandingDirt = 11,
  LandingSnow = 12,
}

enum ColliderType {
  Cylinder = 0,
  Prism = 1,
}

enum MapPreset {
  None,
  Sandy,
  Grassy,
  Snowy,
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

enum ConnectResponseType {
  Success = 0,
  DuplicateUsername = 1,
}

const FighterTypeStrings = [
  'Sheep',
  'Deer',
  'Flamingo',
];
const FighterTypeGenders = [// He, She, or They
  'She',
  'He',
  'He',
];

/**
 * @function fighterTypeToString
 * @summary Returns a string version of the fighter type
 * @param type Type of fighter the character is
 * @returns {string} The internal name of the character ('Sheep', 'Deer', etc)
 */
function fighterTypeToString(type: FighterType): string {
  return FighterTypeStrings[type];
}

/**
 * @function fighterTypeToGender
 * @summary Returns the gender of the given fighter
 * @param type Type of fighter the character is
 * @returns {string} Gender of the character ('He', 'She', or 'They')
 */
function fighterTypeToGender(type: FighterType): string {
  return FighterTypeGenders[type];
}

export {
  EntityType,
  FighterType,
  ConstraintType,
  ProjectileType,
  ParticleType,
  ColliderType,
  MapPreset,
  UIFrameType,
  RenderQuality,
  ConnectResponseType,
  fighterTypeToString,
  fighterTypeToGender,
};
