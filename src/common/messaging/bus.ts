import { EventEmitter } from 'events';

/**
 * The common interface for all MessageBus consumers.
 */
export interface Consumer {
  (message: any): void;
}

export interface HandledConsumer<T> {
  (message: any): T;
}

export interface Subscriber {
  topic: string;
  consumer: Consumer;
}

/**
 * A list of common topics to use.
 * However, any other topic name can be used on-demand.
 */
export const Topics = {
  Connections: 'connections',
};

/**
 * The interface for the MessageBus.
 * Since no class is exported, this is the
 * type information we want to expose.
*/
interface IMessageBus {
  subscribe(topic: string, consumer: Consumer): Subscriber;
  unsubscribe(topic: string, consumer: Consumer): void;
  addSubscriber(subscriber: Subscriber): void;
  removeSubscriber(subscriber: Subscriber): void;
  subscribers(topic: string): Consumer[];
  clearSubscribers(): void;
  publish(topic: string, message: any): void;
  await<T>(topic: string, timeoutMs: number, consumer: HandledConsumer<T>): Promise<T>;
}

function deferred<T>() {
  let resolve: (value: T) => void;
  let reject: (reason?: any) => void;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {
    resolve,
    reject,
    promise,
  };
}

/**
 * The private MessageBus implementation
 */
class MessageBusImpl extends EventEmitter implements IMessageBus {
  subscribe(topic: string, consumer: Consumer): Subscriber {
    this.on(topic, consumer);
    return {
      topic,
      consumer,
    };
  }

  unsubscribe(topic: string, consumer: Consumer): void {
    this.off(topic, consumer);
  }

  addSubscriber(subscriber: Subscriber): void {
    this.subscribe(subscriber.topic, subscriber.consumer);
  }

  removeSubscriber(subscriber: Subscriber): void {
    this.unsubscribe(subscriber.topic, subscriber.consumer);
  }

  subscribers(topic: string): Consumer[] {
    return this.listeners(topic) as Consumer[];
  }

  clearSubscribers(): void {
    this.removeAllListeners();
  }

  publish(topic: string, message: any): void {
    this.emit(topic, message);
  }

  await<T>(topic: string, timeoutMs: number, consumer: HandledConsumer<T>): Promise<T> {
    const future = deferred<T>();
    let timeout: NodeJS.Timeout;
    const subscriber = this.subscribe(topic, (message: any) => {
      if (consumer(message) != null) {
        this.removeSubscriber(subscriber);
        clearTimeout(timeout);
        future.resolve(message as T);
      }
    });

    timeout = setTimeout(() => {
      this.removeSubscriber(subscriber);
      future.reject(new Error(`Expected message did not arrive in ${timeoutMs}ms on topic ${topic}`));
    }, timeoutMs);

    return future.promise;
  }
}

/**
 * All events go through the message bus. There is only one.
 * Individual components may choose to attach/detach routers
 * of their own design to the message bus at any time.
 */
export const MessageBus = new MessageBusImpl() as IMessageBus;
