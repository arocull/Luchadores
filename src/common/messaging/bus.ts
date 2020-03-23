import { EventEmitter } from 'events';

/**
 * The common interface for all MessageBus consumers.
 */
export interface Consumer {
  receive(message: any): void;
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
  unsubscribe(topic: string, consumer: Consumer): void;
  clearSubscribers(): void;
  publish(topic: string, message: any): void;
}

/**
 * The private MessageBus implementation
 */
class MessageBusImpl extends EventEmitter implements IMessageBus {
  subscribe(topic: string, consumer: Consumer) {
    this.addListener(topic, consumer.receive);
  }

  unsubscribe(topic: string, consumer: Consumer) {
    this.removeListener(topic, consumer.receive);
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
