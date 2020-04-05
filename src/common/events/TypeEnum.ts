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
};

export { TypeEnum as default };
