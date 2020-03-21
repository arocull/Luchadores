export interface Consumer {
  receive(message: any): void;
}

/**
 * All events go through the message bus. There is only one.
 * Individual components may choose to attach/detach routers
 * of their own design to the message bus at any time.
 */
class MessageBus {
  private consumers: Consumer[];

  constructor() {
    this.consumers = [];
  }

  subscribe(consumer: Consumer) {
    this.consumers.push(consumer);
  }

  unsubscribe(consumer: Consumer) {
    this.consumers = this.consumers.filter((x) => x !== consumer);
  }

  publish(message: any) {
    for (let i = 0; i < this.consumers.length; i++) {
      this.consumers[i].receive(message);
    }
  }
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
const INSTANCE = new MessageBus();
export { INSTANCE as default };
