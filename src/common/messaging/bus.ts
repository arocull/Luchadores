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
  Network: 'network',
};

/**
 * The interface for the MessageBus.
 * Since no class is exported, this is the
 * type information we want to expose.
*/
interface IMessageBus {
  subscribe(topic: string, consumer: Consumer): void;
  unsubscribe(topic: string, consumer: Consumer): void;
  publish(topic: string, message: any): void;
}

/**
 * The private MessageBus implementation
 */
class MessageBusImpl implements IMessageBus {
  private consumers: Record<string, Consumer[]>;

  constructor() {
    this.consumers = {};
  }

  private getTopic(topic: string) {
    if (!(topic in this.consumers)) {
      const newTopic: Consumer[] = [];
      this.consumers[topic] = newTopic;
      return newTopic;
    }
    return this.consumers[topic];
  }

  subscribe(topic: string, consumer: Consumer) {
    this.getTopic(topic).push(consumer);
  }

  unsubscribe(topic: string, consumer: Consumer) {
    this.consumers[topic] = this.getTopic(topic).filter((x) => x !== consumer);
  }

  publish(topic: string, message: any) {
    const consumers = this.getTopic(topic);
    for (let i = 0; i < consumers.length; i++) {
      consumers[i].receive(message);
    }
  }
}

/**
 * All events go through the message bus. There is only one.
 * Individual components may choose to attach/detach routers
 * of their own design to the message bus at any time.
 */
export const MessageBus = new MessageBusImpl() as IMessageBus;
