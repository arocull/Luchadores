import { Consumer, MessageBus } from '../../../src/common/messaging/bus';
import { SubscriberContainer } from '../../../src/common/messaging/container';

const topic = 'topic';
const messages: string[] = [];
const consumer: Consumer = (msg) => messages.push(msg);

afterEach(() => {
  MessageBus.clearSubscribers();
  messages.splice(0);
});

test('basic attach and detach', () => {
  const container = new SubscriberContainer();

  const ref = container.attach(topic, consumer);
  MessageBus.publish(topic, 'hello');
  expect(messages[0]).toBe('hello');

  container.detach(ref);
  MessageBus.publish(topic, 'hello2');
  expect(messages[1]).toBeUndefined(); // Removed
});

test('detach all', () => {
  const container = new SubscriberContainer();

  container.attach(topic, consumer);
  container.attachSpecific('a', topic, consumer);
  container.attachSpecific('b', topic, consumer);
  container.attachSpecific('c', topic, consumer);

  MessageBus.publish(topic, 'hello');
  expect(messages.length).toBe(4);

  container.detachAll();
  MessageBus.publish(topic, 'hello');
  expect(messages.length).toBe(4); // No change
});

test('specific attach and detach', () => {
  const container = new SubscriberContainer();

  // With named classifiers
  container.attachSpecific('main', topic, consumer);
  MessageBus.publish(topic, 'hello');
  expect(messages[0]).toBe('hello');

  container.detachAllSpecific(null);
  MessageBus.publish(topic, 'hello2');
  expect(messages[1]).toBe('hello2'); // No effect

  container.detachAllSpecific('main');
  MessageBus.publish(topic, 'hello3');
  expect(messages[2]).toBeUndefined(); // Removed

  // With null classifiers
  container.attachSpecific(null, topic, consumer);
  MessageBus.publish(topic, 'hello4');
  expect(messages[2]).toBe('hello4'); // No increment since last was no-op

  container.detachAllSpecific('main');
  MessageBus.publish(topic, 'hello5');
  expect(messages[3]).toBe('hello5'); // No effect

  container.detachAllSpecific(null);
  MessageBus.publish(topic, 'hello6');
  expect(messages[4]).toBeUndefined(); // Removed
});
