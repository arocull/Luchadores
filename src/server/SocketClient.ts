import * as WebSocket from 'ws';

import logger from './Logger';
import * as events from '../common/events';
import { Consumer, MessageBus, Topics } from '../common/messaging/bus';
import { decoder, encoder } from '../common/messaging/serde';

interface AddressInfo {
  remoteFamily?: string;
  remoteAddress?: string;
  remotePort?: number;
}

class SocketClient {
  private id: string;

  private clientAckTimeout: NodeJS.Timeout;
  private clientAckConsumer: Consumer;
  private publishToClientConsumer: Consumer;

  constructor(
    private socket: WebSocket,
    private addressInfo: AddressInfo,
  ) {
    this.socket.on('message', (data: Buffer) => this.onMessage(data));
    this.socket.on('close', (code: number, reason: string) => this.onClose(code, reason));

    // If the client hasn't identified themselves in short order, close their connection.
    this.clientAckTimeout = setTimeout(() => {
      logger.error('Client did not ACK in time - disconnecting: %j', this.addressInfo);
      socket.close();
    }, 2000);

    this.clientAckConsumer = (message: events.IEvent) => {
      // Our internal listener only cares about this event.
      if (message.type === events.TypeEnum.ClientConnect) {
        // Handle the event and unsubscribe. We shouldn't see this again.
        this.onConnect(message);
        MessageBus.unsubscribe(Topics.ServerNetworkFromClient, this.clientAckConsumer);
      }
    };

    this.publishToClientConsumer = (message: events.IEvent) => {
      this.socket.send(encoder(message));
    };
  }

  subscribe() {
    MessageBus.subscribe(Topics.ServerNetworkFromClient, this.clientAckConsumer);
    MessageBus.subscribe(Topics.ServerNetworkToClient, this.publishToClientConsumer);

    return this; // shut up linter
  }

  unsubscribe() {
    MessageBus.unsubscribe(Topics.ServerNetworkFromClient, this.clientAckConsumer);
    MessageBus.unsubscribe(Topics.ServerNetworkToClient, this.publishToClientConsumer);

    return this; // shut up linter
  }

  onConnect(event: events.IClientConnect) {
    this.id = event.id;
    logger.info('Socket ClientConnect - this client is now %o', this.id);
    clearTimeout(this.clientAckTimeout);

    MessageBus.publish(Topics.ServerNetworkToClient, <events.IClientAck>{
      type: events.TypeEnum.ClientAck,
      id: this.id,
    });
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

    MessageBus.publish(Topics.ServerNetworkFromClient, <events.IClientDisconnect>{
      type: events.TypeEnum.ClientDisconnect,
      id: this.id,
    });
  }
}

export { SocketClient as default };
