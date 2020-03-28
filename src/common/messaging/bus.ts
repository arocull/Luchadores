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

/**
 * A list of common topics to use.
 * However, any other topic name can be used on-demand.
 */
export const Topics = {
  ClientNetworkFromServer: 'client-network-from-server',
  ClientNetworkToServer: 'client-network-to-server',
  ServerNetworkFromClient: 'server-network-from-client',
  ServerNetworkToClient: 'server-network-to-client',
};

/**
 * The interface for the MessageBus.
 * Since no class is exported, this is the
 * type information we want to expose.
*/
interface IMessageBus {
  subscribe(topic: string, consumer: Consumer): void;
  await<T>(topic: string, timeoutMs: number, consumer: HandledConsumer<T>): Promise<T>;
  unsubscribe(topic: string, consumer: Consumer): void;
  subscribers(topic: string): Consumer[];
  clearSubscribers(): void;
  publish(topic: string, message: any): void;
}

/**
 * The private MessageBus implementation
 */
class MessageBusImpl extends EventEmitter implements IMessageBus {
  subscribe(topic: string, consumer: Consumer) {
    this.on(topic, consumer);
  }

  await<T>(topic: string, timeoutMs: number, consumer: HandledConsumer<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      let wrappedConsumer: Consumer;
      const timeout = setTimeout(() => {
        this.off(topic, wrappedConsumer);
        reject(new Error(`Expected message did not arrive in ${timeoutMs}ms on topic ${topic}`));
      }, timeoutMs);

      wrappedConsumer = (message: any) => {
        if (consumer(message) != null) {
          clearTimeout(timeout);
          this.off(topic, wrappedConsumer);
          resolve(message);
        }
      };
      this.on(topic, wrappedConsumer);
    });
  }

  unsubscribe(topic: string, consumer: Consumer) {
    this.off(topic, consumer);
  }

  subscribers(topic: string): Consumer[] {
    return this.listeners(topic) as Consumer[];
  }

  clearSubscribers() {
    this.removeAllListeners();
  }

  publish(topic: string, message: any) {
    this.emit(topic, message);
  }
}

/**
 * All events go through the message bus. There is only one.
 * Individual components may choose to attach/detach routers
 * of their own design to the message bus at any time.
 */
export const MessageBus = new MessageBusImpl() as IMessageBus;
