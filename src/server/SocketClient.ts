import * as WebSocket from 'ws';

import logger from './Logger';
import * as events from '../common/events';
import { Consumer, MessageBus } from '../common/messaging/bus';
import { decoder, encoder } from '../common/messaging/serde';

interface AddressInfo {
  remoteFamily?: string;
  remoteAddress?: string;
  remotePort?: number;
}

class SocketClient {
  private _id: string;
  private _topicServerToClient: string;
  private _topicClientToServer: string;

  private publishToClientConsumer: Consumer;

  constructor(
    private socket: WebSocket,
    private addressInfo: AddressInfo,
  ) {
    this.socket.on('close', (code: number, reason: string) => this.onClose(code, reason));

    // If the client hasn't identified themselves in short order, close their connection.
    {
      const awaitTimeout = setTimeout(() => {
        logger.error('Client did not ACK in time - disconnecting: %j, %j', this.addressInfo);
        this.socket.close();
      }, 2000);

      const awaitConsumer = (data: Buffer) => {
        const message = decoder(data);
        if (message.type === events.TypeEnum.ClientConnect) {
          // Handle the event and finish the connection setup
          this.id = message.id;
          logger.info('Socket ClientConnect - this client is now %o', this.id);

          clearTimeout(awaitTimeout); // Cancel timeout connection killer
          this.socket.removeEventListener('message', awaitConsumer as any); // Remove this listener (there is no `socket.off`)
          this.subscribe(); // Subscribe to the client topic(s)
          this.socket.on('message', (msgData: Buffer) => this.onMessage(msgData)); // Connect the primary message listener

          // Notify listeners about new connections
          const ack: events.IClientAck = {
            type: events.TypeEnum.ClientAck,
            id: this.id,
          };
          this.publishToClientConsumer(ack); // Reply to the client
          MessageBus.publish('connections', ack); // Complete promises
        }
      };

      // Only listen for connection identifiers at this point
      logger.info('Awaiting client ACK...');
      this.socket.on('message', awaitConsumer);
    }

    this.publishToClientConsumer = (message: any) => {
      const data = !ArrayBuffer.isView(message)
        ? encoder(message)
        : message;
      this.socket.send(data);
    };
  }

  private get id() {
    return this._id;
  }

  private set id(value: string) {
    this._id = value;
    this._topicServerToClient = `server-to-client-${value}`;
    this._topicClientToServer = `client-to-server-${value}`;
  }

  get topicServerToClient() {
    return this._topicServerToClient;
  }

  get topicClientToServer() {
    return this._topicClientToServer;
  }

  private subscribe() {
    if (this.id == null) {
      throw new Error('Cannot subscribe - no client id was negotiated yet');
    }

    MessageBus.subscribe(this.topicServerToClient, this.publishToClientConsumer);
  }

  private unsubscribe() {
    if (this.id == null) {
      throw new Error('Cannot unsubscribe - no client id was negotiated yet');
    }

    MessageBus.unsubscribe(this.topicServerToClient, this.publishToClientConsumer);
  }

  connect(): Promise<void> {
    // Client ID already negotiated and...
    if (this.id != null) {
      // OPEN socket
      if (this.socket.readyState === WebSocket.OPEN) {
        return Promise.resolve();
      }
      // CLOSING or CLOSED
      if (this.socket.readyState > WebSocket.OPEN) {
        return Promise.reject(new Error('The connection is closed and cannot reopen.'));
      }
    }

    // Still waiting to negotiate client ID
    return MessageBus.await('connections', 2000, (message: any) => {
      if (this.id != null && message.id === this.id) {
        return message; // Handled
      }
      return null;
    });
  }

  onMessage(data: Buffer) {
    logger.info('Socket receiving data %j', data);

    const decoded = decoder(data);
    logger.info('Socket message decoded %j', decoded);

    MessageBus.publish(this.topicClientToServer, decoded);
    logger.info('Socket message sent to topic %j', this.topicServerToClient);
  }

  close() {
    this.socket.close();
  }

  onClose(code: number, reason: string) {
    logger.info('Socket connection closed %j, %j', code, reason);

    // Only publish a disconnect event if this client managed to identify itself
    if (this.id != null) {
      this.unsubscribe();
      MessageBus.publish(this.topicClientToServer, <events.IClientDisconnect>{
        type: events.TypeEnum.ClientDisconnect,
        id: this.id,
      });
    }
  }
}

export { SocketClient as default };
