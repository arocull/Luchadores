// This file reexports public events modules in a cleaner interface.
// It doesn't reexport all of the inner details of Protobuf.
// Instead, it exposes the necessary interfaces to do communication work.
import * as events from './events';

export { default as TypeEnum } from './TypeEnum';
import TypeEnum from './TypeEnum';

// Erases underlying events.IKind type with more specific enum
export interface IKind {
  type: TypeEnum;
}

export interface IClientAck extends events.IClientAck {
  type: TypeEnum.ClientAck;
}

export interface IClientConnect extends events.IClientConnect {
  type: TypeEnum.ClientConnect;
}

export interface IClientDisconnect extends events.IClientDisconnect {
  type: TypeEnum.ClientDisconnect;
}

export interface ILobbyRequest extends events.ILobbyRequest {
  type: TypeEnum.LobbyRequest;
}

export interface ILobbyResponse extends events.ILobbyResponse {
  type: TypeEnum.LobbyResponse;
}

export interface IPlayerConnect extends events.IPlayerConnect {
  type: TypeEnum.PlayerConnect;
}

export interface IPlayerJoined extends events.IPlayerJoined {
  type: TypeEnum.PlayerJoined;
}

export interface IPlayerInputState extends events.IPlayerInputState {
  type: TypeEnum.PlayerInputState;
}

export type IEvent =
  | IClientAck
  | IClientConnect
  | IClientDisconnect
  | ILobbyRequest
  | ILobbyResponse
  | IPlayerConnect
  | IPlayerJoined
  | IPlayerInputState
  ;
