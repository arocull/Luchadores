enum TypeEnum {
  Ping = 100,
  Pong = 101,

  LobbyRequest = 150,
  LobbyResponse = 151,

  ClientConnecting = 200,
  ClientAcknowledged = 201,
  ClientConnected = 202,
  ClientDisconnected = 203,

  PlayerConnect = 300,
  PlayerSpawned = 301,
  PlayerInputState = 302,
  PlayerDied = 303,
  PlayerState = 304,

  WorldState = 400,
};

export { TypeEnum as default };
