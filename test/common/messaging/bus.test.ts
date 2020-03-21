// TODO: This is awkward for importing exported interfaces.
// Do we really need ESLint enforcing export default?
// In fact we have no way to import the interface because
// ESLint will complain about importing the same file twice.
import MessageBus from '../../../src/common/messaging/bus';

test('send and receive to subscribers', () => {
  const messages: any[] = [];
  const consumer = {
    receive: ((msg: any) => {
      messages.push(msg);
    }),
  };

  MessageBus.publish('hello');
  expect(messages).toEqual([]);

  MessageBus.subscribe(consumer);
  MessageBus.publish('hello');
  expect(messages).toEqual(['hello']);

  messages.splice(0, 100);
  MessageBus.unsubscribe(consumer);
  MessageBus.publish('hello');
  expect(messages).toEqual([]);
});
