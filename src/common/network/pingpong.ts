import { Timer } from '../engine/time/Time';
import {
  TypeEnum, IEvent, IPing, IPong,
} from '../events';
import { MessageBus } from '../messaging/bus';
import { SubscriberContainer } from '../messaging/container';
import { decodeInt64 } from '../messaging/serde';

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

function makePacketId() {
  return Math.floor(Math.random() * 10000000);
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
        this.pong(message);
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
        .then((pingInfo) => this.publish(pingInfo))
        .catch((err) => console.error('Ping interval error:', err));
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

    const sendMs = Timer.now();
    const ping: IPing = {
      type: TypeEnum.Ping,
      timestamp: Timer.now(),
      packetId: makePacketId(),
    };
    MessageBus.publish(this.pingProvider.topicSend, ping);

    return MessageBus.await(this.pingProvider.topicReceive, 2000,
      (message: IEvent) => {
        if (message.type === TypeEnum.Pong && message.packetId === ping.packetId) {
          return message;
        }
        return null;
      })
      .then((pong) => {
        const receiveMs = Timer.now();
        const roundTripTimeMilliseconds = receiveMs - sendMs;
        const roundTripOffsetMs = Math.round(roundTripTimeMilliseconds / 2);
        const serverTimestampCorrected = decodeInt64(pong.timestamp) + roundTripOffsetMs;
        const clockDriftMs = serverTimestampCorrected - receiveMs;
        const pingInfo: PingInfo = {
          id: this.pingProvider.id,
          roundTripTimeMilliseconds,
          remoteTimestamp: serverTimestampCorrected,
          clockDriftMilliseconds: clockDriftMs,
        };
        return pingInfo;
      });
  }

  /** Replies with a pong */
  pong(ping: IPing) {
    const pong: IPong = {
      type: TypeEnum.Pong,
      timestamp: Timer.now(),
      packetId: ping.packetId,
    };
    MessageBus.publish(this.pingProvider.topicSend, pong);
  }

  publish(pingInfo: PingInfo) {
    MessageBus.publish(Topics.PingInfo, pingInfo);
  }
}
