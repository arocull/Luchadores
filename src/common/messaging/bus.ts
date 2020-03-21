export interface Consumer {
  receive(message: any): void;
}

// TODO: Does this make any sense? Should there be more than one?
//
// We won't want to overload non-game buses with huge volumes of game events.
// On the other hand, managing multiple buses over a single network socket will
// difficult and awkward if we start running multiple buses.
//
// One message bus (network) could perhaps dispatch to other buses in a sort
// chain, distributing the load to the proper components much higher up.
//
// Should there be multiple topics instead of multiple message busses?
// A consumer component could decide later on how to split messages.
// Sort of like a router for the message bus itself?

class MessageBusImpl {
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
export const MessageBus = new MessageBusImpl();
