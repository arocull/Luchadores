import * as events from '../../../src/common/events';
import { decoder, encoder } from '../../../src/common/messaging/serde';

test('decodes lobby.LobbyRequest', () => {
  const encoded = events.LobbyRequest.encode({
    type: events.TypeEnum.LobbyRequest,
    search: 'hello',
  }).finish();

  const message = decoder(encoded) as events.LobbyRequest;
  expect(message).toBeInstanceOf(events.LobbyRequest);
  expect(message.search).toBe('hello');
});

test('encodes lobby.LobbyRequest', () => {
  const encoded = encoder(<events.ILobbyRequest>{
    type: events.TypeEnum.LobbyRequest,
    search: 'hello',
  });

  const message = events.LobbyRequest.decode(encoded);
  expect(message).toBeInstanceOf(events.LobbyRequest);
  expect(message.search).toBe('hello');
});

test('decodes lobby.LobbyResponse', () => {
  const encoded = events.LobbyResponse.encode({
    type: events.TypeEnum.LobbyResponse,
    lobbyNames: ['one', 'two', 'three'],
  }).finish();

  const message = decoder(encoded) as events.LobbyResponse;
  expect(message).toBeInstanceOf(events.LobbyResponse);
  expect(message.lobbyNames).toEqual(['one', 'two', 'three']);
});

test('encodes lobby.LobbyResponse', () => {
  const encoded = encoder(<events.ILobbyResponse>{
    type: events.TypeEnum.LobbyResponse,
    lobbyNames: ['one', 'two', 'three'],
  });

  const message = events.LobbyResponse.decode(encoded);
  expect(message).toBeInstanceOf(events.LobbyResponse);
  expect(message.lobbyNames).toEqual(['one', 'two', 'three']);
});
