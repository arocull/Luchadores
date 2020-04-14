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
  private pingProvider?: PingProvider;

  constructor() {
    this.subscribers = new SubscriberContainer();
  }

  subscribe(pingProvider: PingProvider) {
    this.pingProvider = pingProvider;
    this.subscribers.attach(this.pingProvider.topicReceive, (message: IEvent) => {
      if (message.type === TypeEnum.Ping) {
        this.pong();
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
      this.ping()
        .then((pingInfo) => MessageBus.publish(Topics.PingInfo, pingInfo));
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

    const sendMs = Date.now();
    MessageBus.publish(this.pingProvider.topicSend, <IPing>{
      type: TypeEnum.Ping,
      timestamp: Date.now(),
    });

    return MessageBus.await(this.pingProvider.topicReceive, 2000,
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
          id: this.pingProvider.id,
          remoteTimestamp: serverTimestampCorrected,
          clockDriftMilliseconds: clockDriftMs,
        };
        return pingInfo;
      });
  }

  /** Replies with a pong */
  pong() {
    MessageBus.publish(this.pingProvider.topicSend, <IPong>{
      type: TypeEnum.Pong,
      timestamp: Date.now(),
    });
  }
}
