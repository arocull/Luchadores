// This file reexports public events modules in a cleaner interface.
// It doesn't reexport all of the inner details of Protobuf.
// Instead, it exposes the necessary interfaces to do communication work.
import * as events from './events';

export { default as TypeEnum } from './TypeEnum';
import TypeEnum from './TypeEnum';

// Erases underlying events.IKind type with more specific enum
// TODO: Is this still useful? Can this be removed? Should it be removed? Serde only interface?
export interface IKind {
  type: TypeEnum;
}

export interface IClientConnecting extends events.IClientConnecting {
  type: TypeEnum.ClientConnecting;
}

export interface IClientAcknowledged extends events.IClientAcknowledged {
  type: TypeEnum.ClientAcknowledged;
}

export interface IClientConnected extends events.IClientConnected {
  type: TypeEnum.ClientConnected;
}

export interface IClientDisconnected extends events.IClientDisconnected {
  type: TypeEnum.ClientDisconnected;
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

export interface IPlayerSpawned extends events.IPlayerSpawned {
  type: TypeEnum.PlayerSpawned;
}

export interface IPlayerInputState extends events.IPlayerInputState {
  type: TypeEnum.PlayerInputState;
}

export interface IPlayerDied extends events.IPlayerDied {
  type: TypeEnum.PlayerDied;
}

export interface IPlayerState extends events.IPlayerState {
  type: TypeEnum.PlayerState;
}

export interface IWorldState extends events.IWorldState {
  type: TypeEnum.WorldState;
}

export type IEvent =
  | IClientConnecting
  | IClientAcknowledged
  | IClientConnected
  | IClientDisconnected
  | ILobbyRequest
  | ILobbyResponse
  | IPlayerConnect
  | IPlayerSpawned
  | IPlayerInputState
  | IPlayerDied
  | IWorldState
  ;
