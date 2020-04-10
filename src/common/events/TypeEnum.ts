enum TypeEnum {
  LobbyRequest = 100,
  LobbyResponse = 101,

  ClientConnect = 200,
  ClientAck = 201,
  ClientDisconnect = 202,

  PlayerConnect = 300,
  PlayerSpawned = 301,
  PlayerInputState = 302,
  PlayerDied = 303,
  PlayerState = 304,

  WorldState = 400,
};

export { TypeEnum as default };
