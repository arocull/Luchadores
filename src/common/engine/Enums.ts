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
  BulletShell = 7,
  MoveDash = 8,
  Shockwave = 9,
  Snowfall = 10,
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

const FighterTypeStrings = [
  'Sheep',
  'Deer',
  'Flamingo',
  'Toad',
];

function fighterTypeToString(type: FighterType) {
  return FighterTypeStrings[type];
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
  fighterTypeToString,
};
