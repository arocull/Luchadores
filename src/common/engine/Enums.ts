enum EntityType {
  Fighter = 0,
  Projectile = 1,
  Particle = 2,
}

enum FighterType {
  Sheep = 0,
  Deer = 1,
  Flamingo = 2,
  Toad = 3,
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
}

enum UIFrameType {
  Basic = 0,
  Text = 1,
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
  UIFrameType,
  fighterTypeToString,
};
