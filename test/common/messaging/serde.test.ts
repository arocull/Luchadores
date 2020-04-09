import * as events from '../../../src/common/events';
import { decoder, encoder } from '../../../src/common/messaging/serde';
import { IPlayerInputState } from '../../../src/common/events/events';

test('encodes and decodes LobbyRequest', () => {
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

test('encodes and decodes LobbyResponse', () => {
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

test('encodes and decodes PlayerInputState', () => {
  const encoded = encoder({
    type: events.TypeEnum.PlayerInputState,
    jump: true,
    mouseDown: true,
    mouseDirection: { x: 1.5, y: 2.5, z: 3.5 },
    moveDirection: { x: 4.5, y: 5.5, z: 6.5 },
  } as IPlayerInputState);
  expect(ArrayBuffer.isView(encoded)).toBe(true);

  const message = decoder(encoded);
  if (message.type !== events.TypeEnum.PlayerInputState) {
    fail('Type mismatch!');
  }

  expect(message.type).toBe(events.TypeEnum.PlayerInputState);
  expect(message.jump).toBe(true);
  expect(message.mouseDown).toBe(true);
  expect(message.mouseDirection).not.toBeNull();
  expect(message.moveDirection).not.toBeNull();
  expect(message.mouseDirection.x).toBeCloseTo(1.5);
  expect(message.mouseDirection.y).toBeCloseTo(2.5);
  expect(message.mouseDirection.z).toBeCloseTo(3.5);
  expect(message.moveDirection.x).toBeCloseTo(4.5);
  expect(message.moveDirection.y).toBeCloseTo(5.5);
  expect(message.moveDirection.z).toBeCloseTo(6.5);
});
