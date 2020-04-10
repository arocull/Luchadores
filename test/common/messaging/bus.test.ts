import {
  Consumer,
  HandledConsumer,
  MessageBus,
} from '../../../src/common/messaging/bus';

afterEach(() => {
  MessageBus.clearSubscribers();
});

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

test('subscription objects work', () => {
  const topic = 'topic';
  const messages: any[] = [];

  const subscriber = MessageBus.subscribe(topic, (message: any) => {
    messages.push(message);
  });
  expect(subscriber).not.toBeNull();
  expect(subscriber.consumer).not.toBeNull();
  expect(subscriber.topic).toBe(topic);

  MessageBus.publish(topic, 'hello');
  expect(messages[0]).toBe('hello');

  MessageBus.removeSubscriber(subscriber);
  MessageBus.publish(topic, 'hello2');
  expect(messages.length).toBe(1); // No new messages
});

test('await message', async () => {
  const topic = 'topic';
  let hits = 0;
  const consumer: HandledConsumer<string> = (msg: any) => {
    hits++;
    if (msg === 'hello') {
      return msg;
    }
    return null;
  };

  try {
    await MessageBus.await(topic, 500, consumer);
    fail('Should have gotten rejection!');
  } catch (err) {
    expect(err.message).toContain('did not arrive');
    expect(hits).toBe(0);
    expect(MessageBus.subscribers(topic).length).toBe(0);
  }

  const promise = MessageBus.await(topic, 500, consumer);
  MessageBus.publish(topic, 'hello');
  const result = await promise;
  expect(result).toBe('hello');
  expect(hits).toBe(1);
  expect(MessageBus.subscribers(topic).length).toBe(0);

  // Doing it again should fail - it should only accept once
  try {
    await MessageBus.await(topic, 500, consumer);
    fail('Should have gotten rejection! Second attempt should not succeed.');
  } catch (err) {
    expect(err.message).toContain('did not arrive');
    expect(hits).toBe(1);
    expect(MessageBus.subscribers(topic).length).toBe(0);
  }
});
