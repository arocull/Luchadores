import * as WebSocket from 'ws';

import logger from './Logger';
import * as events from '../common/events/events';
import { Consumer, MessageBus, Topics } from '../common/messaging/bus';
import { decoder } from '../common/messaging/serde';

interface AddressInfo {
  remoteFamily?: string;
  remoteAddress?: string;
  remotePort?: number;
}

class SocketClient {
  private id: string;
  private consumer: Consumer;

  constructor(
    private socket: WebSocket,
    private addressInfo: AddressInfo,
  ) {
    this.socket.on('message', (data: Buffer) => this.onMessage(data));
    this.socket.on('close', (code: number, reason: string) => this.onClose(code, reason));

    this.consumer = (message) => {
      if (message.type === events.core.TypeEnum.ClientConnect) {
        this.onConnect(message);
      }
    };
  }

  subscribe() {
    MessageBus.subscribe(Topics.ServerNetworkFromClient, this.consumer);

    return this; // shut up linter
  }

  unsubscribe() {
    MessageBus.unsubscribe(Topics.ServerNetworkFromClient, this.consumer);

    return this; // shut up linter
  }

  // TODO: Implement a timeout somewhere around here.
  // If the client hasn't identified themselves in short order, close their connection.
  onConnect(event: events.client.IClientConnect) {
    this.id = event.id;
    logger.info('Socket ClientConnect - this client is now %o', this.id);

    return this; // shut up linter
  }

  onMessage(data: Buffer) {
    logger.info('Socket receiving data %j', data);

    const decoded = decoder(data);
    logger.info('Socket message decoded %j', decoded);

    MessageBus.publish(Topics.ServerNetworkFromClient, decoded);

    return this; // shut up linter
  }

  onClose(code: number, reason: string) {
    logger.info('Socket connection closed %j, %j', code, reason);

    MessageBus.publish(Topics.ServerNetworkFromClient, <events.client.IClientDisconnect>{
      type: events.core.TypeEnum.ClientDisconnect,
      id: this.id,
    });

    return this; // shut up linter
  }
}

export { SocketClient as default };
