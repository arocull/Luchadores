// TODO: This is awkward for importing exported interfaces.
// Do we really need ESLint enforcing export default?
// In fact we have no way to import the interface because
// ESLint will complain about importing the same file twice.
import { Consumer, MessageBus } from '../../../src/common/messaging/bus';

test('send and receive to subscribers', () => {
  const topic = 'topic';
  const messages: any[] = [];
  const consumer: Consumer = {
    receive: ((msg: any) => {
      messages.push(msg);
    }),
  };

  MessageBus.publish(topic, 'hello');
  expect(messages).toEqual([]);

  MessageBus.subscribe(topic, consumer);
  MessageBus.publish(topic, 'hello');
  expect(messages).toEqual(['hello']);

  messages.splice(0, 100);
  MessageBus.unsubscribe(topic, consumer);
  MessageBus.publish(topic, 'hello');
  expect(messages).toEqual([]);
});
