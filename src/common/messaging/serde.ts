// "serde" is shorthand for "serializer / deserializer"
import * as events from '../events';

interface ProtobufTypeSerde {
  encode(message: any): protobuf.Writer;
  decode(data: Uint8Array): any;
}

const { TypeEnum } = events;
function getProtobufType(object: events.IKind): ProtobufTypeSerde {
  switch (object.type) {
    case TypeEnum.ClientConnect:
      return events.ClientConnect;
    case TypeEnum.ClientAck:
      return events.ClientAck;
    case TypeEnum.ClientDisconnect:
      return events.ClientDisconnect;
    case TypeEnum.LobbyRequest:
      return events.LobbyRequest;
    case TypeEnum.LobbyResponse:
      return events.LobbyResponse;
    default:
      // TODO: Figure out how to make this an exhaustive switch
      // and produce a compile error if not all cases are covered.
      // https://www.typescriptlang.org/docs/handbook/advanced-types.html#exhaustiveness-checking
      throw new Error(`Unexpected TypeEnum in serde: ${object.type}`);
  }
}

export function encoder(kind: events.IKind): Uint8Array {
  const serde = getProtobufType(kind);
  return serde.encode(kind).finish();
}

/**
 * Decodes the provided envelope into its concrete type
 */
export function decoder(buffer: Buffer | ArrayBuffer | Uint8Array): events.IKind {
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
