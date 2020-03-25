// Reexporting events modules in a cleaner interface
import * as events from './events';
export {
  Kind,
  ClientAck,
  ClientConnect,
  ClientDisconnect,
  LobbyRequest,
  LobbyResponse,
} from './events';

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

export type IEvent =
  | IClientAck
  | IClientConnect
  | IClientDisconnect
  | ILobbyRequest
  | ILobbyResponse
  ;
