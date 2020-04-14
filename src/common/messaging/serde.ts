// "serde" is shorthand for "serializer / deserializer"
import * as Long from 'long';

import { IEvent, TypeEnum } from '../events'; // The public interface types
import * as events from '../events/events'; // The private Protobuf classes

interface ProtobufTypeSerde {
  encode(message: any): protobuf.Writer;
  decode(data: Uint8Array): any;
}

function getProtobufType(object: IEvent): ProtobufTypeSerde {
  switch (object.type) {
    case TypeEnum.ClientConnecting:
      return events.ClientConnecting;
    case TypeEnum.ClientAcknowledged:
      return events.ClientAcknowledged;
    case TypeEnum.ClientConnected:
      return events.ClientConnected;
    case TypeEnum.ClientDisconnected:
      return events.ClientDisconnected;
    case TypeEnum.LobbyRequest:
      return events.LobbyRequest;
    case TypeEnum.LobbyResponse:
      return events.LobbyResponse;
    case TypeEnum.PlayerConnect:
      return events.PlayerConnect;
    case TypeEnum.PlayerSpawned:
      return events.PlayerSpawned;
    case TypeEnum.PlayerInputState:
      return events.PlayerInputState;
    case TypeEnum.PlayerDied:
      return events.PlayerDied;
    case TypeEnum.PlayerState:
      return events.PlayerState;
    case TypeEnum.Ping:
    case TypeEnum.Pong: // Falls thru - same struct
      return events.PingPong;
    case TypeEnum.WorldState:
      return events.WorldState;
    default:
      // TODO: Figure out how to make this an exhaustive switch
      // and produce a compile error if not all cases are covered.
      // https://www.typescriptlang.org/docs/handbook/advanced-types.html#exhaustiveness-checking
      throw new Error(`Unexpected TypeEnum in serde: ${(object as IEvent).type}`);
  }
}

export function encoder(kind: IEvent): Uint8Array {
  const serde = getProtobufType(kind);
  return serde.encode(kind).finish();
}

/**
 * Decodes the provided envelope into its concrete type
 */
export function decoder(buffer: Buffer | ArrayBuffer | Uint8Array): IEvent {
  let data: Uint8Array;
  if (buffer instanceof Buffer
      || buffer instanceof ArrayBuffer) {
    data = new Uint8Array(buffer);
  } else {
    data = buffer;
  }

  const kind = events.Kind.decode(data);
  const serde = getProtobufType(kind);
  return serde.decode(data);
}

export function decodeInt64(value: number | Long): number {
  if (Long.isLong(value)) {
    return (value as Long).toNumber();
  }
  if (typeof value === 'number') {
    return value;
  }
  throw new Error(`Cannot decode value: ${typeof value}, ${value}`);
}
