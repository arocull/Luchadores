import { now } from '../engine/Time';
import {
  TypeEnum, IEvent, IPing, IPong,
} from '../events';
import { MessageBus } from '../messaging/bus';
import { SubscriberContainer } from '../messaging/container';

export const Topics = {
  PingInfo: 'ping-info',
};

export interface PingProvider {
  id: string;
  topicSend: string;
  topicReceive: string;
}

export interface PingInfo {
  /**
   * The client ID that this ping belongs to.
   */
  id: string;
  /**
   * The number of milliseconds between the ping sent and the pong received.
   */
  roundTripTimeMilliseconds: number;
}

export class PingPongHandler {
  private intervalHandle?: NodeJS.Timeout;
  private subscribers: SubscriberContainer;
  private pingProvider?: PingProvider;

  constructor() {
    this.subscribers = new SubscriberContainer();
  }

  subscribe(pingProvider: PingProvider) {
    this.pingProvider = pingProvider;
    this.subscribers.attach(this.pingProvider.topicReceive, (message: IEvent) => {
      if (message.type === TypeEnum.Ping) {
        this.pong(message.packetId);
      }
    });
  }

  unsubscribe() {
    this.pingProvider = null;
    this.subscribers.detachAll();
  }

  /**
   * Start an interval timer to poll pings and broadcast out to ping-info topic.
   */
  start(intervalMs: number) {
    if (this.intervalHandle != null) {
      this.stop();
    }
    this.intervalHandle = setInterval(() => {
      // TODO: Where to send ping rejections?
      this.ping()
        .then((pingInfo) => this.publish(pingInfo))
        .catch((err) => console.error('Ping rejection!', err));
    }, intervalMs);
  }

  stop() {
    clearInterval(this.intervalHandle);
    this.intervalHandle = null;
  }

  /**
   * Sends a ping and awaits a pong reply.
   * Resolved pings will also be announced on the ping-info topic.
   */
  ping(): Promise<PingInfo> {
    if (this.pingProvider == null) {
      return Promise.reject(new Error('No sending topic connected - cannot ping'));
    }

    const sendMs = now();
    const thisPing: IPing = {
      type: TypeEnum.Ping,
      packetId: Math.floor(Math.random() * 1000000),
    };
    MessageBus.publish(this.pingProvider.topicSend, thisPing);

    return MessageBus.await(this.pingProvider.topicReceive, 2000,
      (message: IEvent) => {
        if (message.type === TypeEnum.Pong && message.packetId === thisPing.packetId) {
          return message;
        }
        return null;
      })
      .then(() => {
        const receiveMs = now();
        const roundTripTimeMilliseconds = receiveMs - sendMs;
        const pingInfo: PingInfo = {
          id: this.pingProvider.id,
          roundTripTimeMilliseconds,
        };
        return pingInfo;
      });
  }

  /** Replies with a pong */
  pong(packetId: number) {
    MessageBus.publish(this.pingProvider.topicSend, <IPong>{
      type: TypeEnum.Pong,
      packetId,
    });
  }

  publish(pingInfo: PingInfo) {
    MessageBus.publish(Topics.PingInfo, pingInfo);
  }
}
