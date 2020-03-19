import * as events from '../../../src/common/events/events';
import MessageHandler from '../../../src/common/messaging/handler';
import MessageRouter from '../../../src/common/messaging/router';

test('emits to listener', () => {
  let routerHit = false;
  const router = new MessageRouter();

  router.addHandler(new MessageHandler(events.lobby.LobbyRequest, () => {
    routerHit = true;
  }));

  router.emit(events.lobby.LobbyRequest.create({ search: 'hello' }));

  expect(routerHit).toBe(true);
});

test('does not emit to others', () => {
  let routerHit = false;
  const router = new MessageRouter();

  router.addHandler(new MessageHandler(events.lobby.LobbyResponse, () => {
    routerHit = true;
  }));

  router.emit(events.lobby.LobbyRequest.create({ search: 'hello' }));

  expect(routerHit).toBe(false);
});

test('listener to be removed', () => {
  let routerHit = false;
  const router = new MessageRouter();
  const handler = new MessageHandler(events.lobby.LobbyRequest, () => {
    routerHit = true;
  });

  router.addHandler(handler);
  router.emit(events.lobby.LobbyRequest.create({ search: 'hello' }));
  expect(routerHit).toBe(true);

  // reset and remove
  routerHit = false;
  router.removeHandler(handler);
  router.emit(events.lobby.LobbyRequest.create({ search: 'hello' }));
  expect(routerHit).toBe(false);
});
