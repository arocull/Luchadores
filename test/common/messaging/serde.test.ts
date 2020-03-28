import * as events from '../../../src/common/events';
import { decoder, encoder } from '../../../src/common/messaging/serde';

test('encodes and decodes lobby.LobbyRequest', () => {
  const encoded = encoder({
    type: events.TypeEnum.LobbyRequest,
    search: 'hello',
  });
  expect(ArrayBuffer.isView(encoded)).toBe(true);

  const message = decoder(encoded);
  if (message.type !== events.TypeEnum.LobbyRequest) {
    fail('Type mismatch!');
  }

  expect(message.type).toBe(events.TypeEnum.LobbyRequest);
  expect(message.search).toBe('hello');
});

test('encodes and decodes lobby.LobbyResponse', () => {
  const encoded = encoder({
    type: events.TypeEnum.LobbyResponse,
    lobbyNames: ['one', 'two', 'three'],
  });
  expect(ArrayBuffer.isView(encoded)).toBe(true);

  const message = decoder(encoded);
  if (message.type !== events.TypeEnum.LobbyResponse) {
    fail('Type mismatch!');
  }

  expect(message.type).toBe(events.TypeEnum.LobbyResponse);
  expect(message.lobbyNames).toEqual(['one', 'two', 'three']);
});
