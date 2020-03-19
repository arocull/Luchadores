import * as events from '../../../src/common/events/events';
import decode from '../../../src/common/messaging/decoder';

// Structural typing saves the day!
interface Encoder<T> {
  encode(body: T): Finisher;
}

interface Finisher {
  finish(): Uint8Array;
}

function makeEnvelope<T>(typeEnum: events.core.TypeEnum, type: Encoder<T>, body: T) {
  return events.core.Envelope.create({
    type: typeEnum,
    data: type.encode(body).finish(),
  });
}

test('decodes lobby.LobbyRequest', () => {
  const envelope = makeEnvelope(
    events.core.TypeEnum.LobbyRequest,
    events.lobby.LobbyRequest,
    { search: 'hello' },
  );

  const message = decode(envelope) as events.lobby.LobbyRequest;
  expect(message).toBeInstanceOf(events.lobby.LobbyRequest);
  expect(message.search).toBe('hello');
});

test('decodes lobby.LobbyResponse', () => {
  const envelope = makeEnvelope(
    events.core.TypeEnum.LobbyResponse,
    events.lobby.LobbyResponse,
    { lobbyNames: ['one', 'two', 'three'] },
  );

  const message = decode(envelope) as events.lobby.LobbyResponse;
  expect(message).toBeInstanceOf(events.lobby.LobbyResponse);
  expect(message.lobbyNames).toEqual(['one', 'two', 'three']);
});
