import { Consumer, MessageBus } from '../../../src/common/messaging/bus';

test('send and receive to subscribers', () => {
  const topic = 'topic';
  const messages: any[] = [];
  const consumer: Consumer = (msg: any) => {
    messages.push(msg);
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
