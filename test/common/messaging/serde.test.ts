import * as events from '../../../src/common/events/events';
import { decoder, encoder } from '../../../src/common/messaging/serde';

test('decodes lobby.LobbyRequest', () => {
  const encoded = events.lobby.LobbyRequest.encode({
    type: events.core.TypeEnum.LobbyRequest,
    search: 'hello',
  }).finish();

  const message = decoder(encoded) as events.lobby.LobbyRequest;
  expect(message).toBeInstanceOf(events.lobby.LobbyRequest);
  expect(message.search).toBe('hello');
});

test('encodes lobby.LobbyRequest', () => {
  const encoded = encoder(<events.lobby.ILobbyRequest>{
    type: events.core.TypeEnum.LobbyRequest,
    search: 'hello',
  });

  const message = events.lobby.LobbyRequest.decode(encoded);
  expect(message).toBeInstanceOf(events.lobby.LobbyRequest);
  expect(message.search).toBe('hello');
});

test('decodes lobby.LobbyResponse', () => {
  const encoded = events.lobby.LobbyResponse.encode({
    type: events.core.TypeEnum.LobbyResponse,
    lobbyNames: ['one', 'two', 'three'],
  }).finish();

  const message = decoder(encoded) as events.lobby.LobbyResponse;
  expect(message).toBeInstanceOf(events.lobby.LobbyResponse);
  expect(message.lobbyNames).toEqual(['one', 'two', 'three']);
});

test('encodes lobby.LobbyResponse', () => {
  const encoded = encoder(<events.lobby.ILobbyResponse>{
    type: events.core.TypeEnum.LobbyResponse,
    lobbyNames: ['one', 'two', 'three'],
  });

  const message = events.lobby.LobbyResponse.decode(encoded);
  expect(message).toBeInstanceOf(events.lobby.LobbyResponse);
  expect(message.lobbyNames).toEqual(['one', 'two', 'three']);
});
