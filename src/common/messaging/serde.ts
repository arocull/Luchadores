// "serde" is shorthand for "serializer / deserializer"
import * as events from '../events/events';

export interface Kind {
  // This is optional for type compatibility, but effectively required in practice.
  // proto3 syntax does not have the concept of "required" fields.
  // https://stackoverflow.com/a/31814967/97964
  // https://capnproto.org/faq.html#how-do-i-make-a-field-required-like-in-protocol-buffers
  type?: events.core.TypeEnum;
}

interface ProtobufTypeSerde {
  encode(message: any): protobuf.Writer;
  decode(data: Uint8Array): any;
}

const { TypeEnum } = events.core;
function getProtobufType(object: Kind): ProtobufTypeSerde {
  switch (object.type) {
    case TypeEnum.ClientConnect:
      return events.client.ClientConnect;
    case TypeEnum.ClientAck:
      return events.client.ClientAck;
    case TypeEnum.ClientDisconnect:
      return events.client.ClientDisconnect;
    case TypeEnum.LobbyRequest:
      return events.lobby.LobbyRequest;
    case TypeEnum.LobbyResponse:
      return events.lobby.LobbyResponse;
    default:
      // TODO: Figure out how to make this an exhaustive switch
      // and produce a compile error if not all cases are covered.
      // https://www.typescriptlang.org/docs/handbook/advanced-types.html#exhaustiveness-checking
      throw new Error(`Unexpected TypeEnum in serde: ${object.type}`);
  }
}

export function encoder(kind: Kind): Uint8Array {
  const serde = getProtobufType(kind);
  return serde.encode(kind).finish();
}

/**
 * Decodes the provided envelope into its concrete type
 */
export function decoder(buffer: Buffer | ArrayBuffer | Uint8Array): Kind {
  let data: Uint8Array;
  if (buffer instanceof Buffer
      || buffer instanceof ArrayBuffer) {
    data = new Uint8Array(buffer);
  } else {
    data = buffer;
  }

  const kind = events.core.Kind.decode(data);
  const serde = getProtobufType(kind);
  return serde.decode(data);
}
