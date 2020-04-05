enum TypeEnum {
  LobbyRequest = 100,
  LobbyResponse = 101,

  ClientConnect = 200,
  ClientAck = 201,
  ClientDisconnect = 202,

  PlayerConnect = 300,
  PlayerJoined = 301,
  PlayerInputState = 302,

  WorldState = 400,

  Entity = 500,
  Entity_Fighter = 501,
  Entity_Projectile = 502,
};

export { TypeEnum as default };
