import { Consumer, MessageBus, Subscriber } from './bus';

export interface SubscriberReference {
  classifier: null | any;
  subscriber: Subscriber;
}

export class SubscriberContainer {
  private subscribers: SubscriberReference[] = [];

  attach(topic: string, consumer: Consumer): SubscriberReference {
    return this.attachSpecific(null, topic, consumer);
  }

  attachSpecific(classifier: null | any, topic: string, consumer: Consumer): SubscriberReference {
    const reference: SubscriberReference = {
      classifier: classifier != null ? classifier : null, // remove undefined, etc
      subscriber: {
        topic,
        consumer,
      },
    };
    this.subscribers.push(reference);
    MessageBus.addSubscriber(reference.subscriber);
    return reference;
  }

  detach(reference: SubscriberReference): void {
    MessageBus.removeSubscriber(reference.subscriber);
    this.subscribers = this.subscribers.filter((x) => x !== reference);
  }

  detachAllSpecific(classifier: null | any): void {
    const c = classifier != null ? classifier : null; // remove undefined, etc
    const matches = this.subscribers.filter((x) => x.classifier === c);
    this.subscribers = this.subscribers.filter((x) => x.classifier !== c);
    matches.forEach((x) => MessageBus.removeSubscriber(x.subscriber));
  }

  detachAll() {
    this.subscribers.forEach((x) => MessageBus.removeSubscriber(x.subscriber));
    this.subscribers = [];
  }
}
