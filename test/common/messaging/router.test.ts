import * as events from '../../../src/common/events/events';
import { MessageHandler, MessageRouter } from '../../../src/common/messaging/router';

test('emits to listener', () => {
  let routerHit = false;
  const router = new MessageRouter();
  const handler: MessageHandler<events.lobby.ILobbyRequest> = {
    isHandled: (msg) => msg instanceof events.lobby.LobbyRequest,
    handle: () => {
      routerHit = true;
    },
  };

  router.addHandler(handler);
  router.emit(events.lobby.LobbyRequest.create({ search: 'hello' }));

  expect(routerHit).toBe(true);
});

test('does not emit to others', () => {
  let routerHit = false;
  const router = new MessageRouter();
  const handler: MessageHandler<events.lobby.ILobbyResponse> = {
    isHandled: (msg) => msg instanceof events.lobby.LobbyResponse,
    handle: () => {
      routerHit = true;
    },
  };

  router.addHandler(handler);
  router.emit(events.lobby.LobbyRequest.create({ search: 'hello' }));

  expect(routerHit).toBe(false);
});

test('listener to be removed', () => {
  let routerHit = false;
  const router = new MessageRouter();
  const handler: MessageHandler<events.lobby.ILobbyRequest> = {
    isHandled: (msg) => msg instanceof events.lobby.LobbyRequest,
    handle: () => {
      routerHit = true;
    },
  };

  router.addHandler(handler);
  router.emit(events.lobby.LobbyRequest.create({ search: 'hello' }));
  expect(routerHit).toBe(true);

  // reset and remove
  routerHit = false;
  router.removeHandler(handler);
  router.emit(events.lobby.LobbyRequest.create({ search: 'hello' }));
  expect(routerHit).toBe(false);
});

test('listeners to be cleared', () => {
  let routerHit = false;
  const router = new MessageRouter();
  const handler: MessageHandler<events.lobby.ILobbyRequest> = {
    isHandled: (msg) => msg instanceof events.lobby.LobbyRequest,
    handle: () => {
      routerHit = true;
    },
  };

  router.addHandler(handler);
  router.emit(events.lobby.LobbyRequest.create({ search: 'hello' }));
  expect(routerHit).toBe(true);

  // reset and remove
  routerHit = false;
  router.clearHandlers();
  router.emit(events.lobby.LobbyRequest.create({ search: 'hello' }));
  expect(routerHit).toBe(false);
});
