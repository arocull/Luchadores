enum TypeEnum {
  LobbyRequest = 100,
  LobbyResponse = 101,

  ClientConnect = 200,
  ClientAck = 201,
  ClientDisconnect = 202,

  PlayerConnect = 300,
  PlayerJoined = 301,
  PlayerInputState = 302,

  Entity = 400,

  Entity_Fighter = 425,
  Entity_Fighter_Sheep = 426,
  Entity_Fighter_Deer = 427,
  Entity_Fighter_Flamingo = 428,
  
  Entity_Projectile = 450,
  Entity_Projectile_Bullet = 451,
  Entity_Projectile_Fire = 452,
};

export { TypeEnum as default };
