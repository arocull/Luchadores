import {
  TypeEnum, IEvent, IPing, IPong,
} from '../events';
import { MessageBus } from '../messaging/bus';
import { SubscriberContainer } from '../messaging/container';

export const Topics = {
  PingInfo: 'ping-info',
};

export interface PingInfo {
  /**
   * The best estimation of the timestamp on the other end of the connection.
   */
  remoteTimestamp: number;
  /**
   * The number of milliseconds to add to the local clock to correct time.
   * May be a negative number.
  */
  clockDriftMilliseconds: number;
}

export class PingPongHandler {
  private intervalHandle?: NodeJS.Timeout;
  private subscribers: SubscriberContainer;
  private topicSend?: string;
  private topicReceive?: string;

  constructor() {
    this.subscribers = new SubscriberContainer();
  }

  subscribe(topicSend: string, topicReceive: string) {
    this.topicSend = topicSend;
    this.topicReceive = topicReceive;
    this.subscribers.attach(topicReceive, (message: IEvent) => {
      if (message.type === TypeEnum.Ping) {
        this.pong();
      }
    });
  }

  unsubscribe() {
    this.topicSend = null;
    this.topicReceive = null;
    this.subscribers.detachAll();
  }

  start(intervalMs: number) {
    if (this.intervalHandle != null) {
      this.stop();
    }
    this.intervalHandle = setInterval(() => this.ping(), intervalMs);
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
    if (this.topicSend == null) {
      return Promise.reject(new Error('No sending topic connected - cannot ping'));
    }

    const sendMs = Date.now();
    MessageBus.publish(this.topicSend, <IPing>{
      type: TypeEnum.Ping,
      timestamp: Date.now(),
    });

    return MessageBus.await(this.topicReceive, 2000,
      (message: IEvent) => {
        if (message.type === TypeEnum.Pong) {
          return message;
        }
        return null;
      })
      .then((pong) => {
        const receiveMs = Date.now();
        const roundTripOffsetMs = Math.round((receiveMs - sendMs) / 2);
        const serverTimestampCorrected = (pong.timestamp as number) + roundTripOffsetMs;
        const clockDriftMs = receiveMs - serverTimestampCorrected;
        const pingInfo: PingInfo = {
          remoteTimestamp: serverTimestampCorrected,
          clockDriftMilliseconds: clockDriftMs,
        };
        MessageBus.publish(Topics.PingInfo, pingInfo);
        return pingInfo;
      });
  }

  /** Replies with a pong */
  pong() {
    MessageBus.publish(this.topicSend, <IPong>{
      type: TypeEnum.Pong,
      timestamp: Date.now(),
    });
  }
}
