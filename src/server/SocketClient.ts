import * as WebSocket from 'ws';

import logger from './Logger';
import * as events from '../common/events';
import { MessageBus, Topics } from '../common/messaging/bus';
import { SubscriberContainer } from '../common/messaging/container';
import { decoder, encoder } from '../common/messaging/serde';
import { PingPongHandler } from '../common/network/pingpong';

interface AddressInfo {
  remoteFamily?: string;
  remoteAddress?: string;
  remotePort?: number;
}

class SocketClient {
  private _id: string;
  private _topicServerToClient: string;
  private _topicServerFromClient: string;
  private pingPongHandler: PingPongHandler;
  private subscribers: SubscriberContainer;

  constructor(
    private socket: WebSocket,
    private addressInfo: AddressInfo,
  ) {
    this.pingPongHandler = new PingPongHandler();
    this.subscribers = new SubscriberContainer();
    this.initialize();
  }

  private get id() {
    return this._id;
  }

  private set id(value: string) {
    this._id = value;
    this._topicServerToClient = `server-to-client-${value}`;
    this._topicServerFromClient = `server-from-client-${value}`;
  }

  get topicServerToClient() {
    return this._topicServerToClient;
  }

  get topicServerFromClient() {
    return this._topicServerFromClient;
  }

  private initialize() {
    this.socket.on('close', (code: number, reason: string) => this.onClose(code, reason));

    // If the client hasn't identified themselves in short order, close their connection.
    const awaitTimeout = setTimeout(() => {
      logger.error('Client did not ACK in time - disconnecting: %j, %j', this.addressInfo);
      this.socket.close();
    }, 2000);

    const awaitConsumer = (data: Buffer) => {
      const message = decoder(data); // TODO: Yuck, can this manual decoder start to go away now?
      if (message.type === events.TypeEnum.ClientConnecting) {
        // Handle the event and finish the connection setup
        this.id = message.id;
        logger.info('Socket ClientConnect - this client is now %o', this.id);

        clearTimeout(awaitTimeout); // Cancel timeout connection killer
        this.socket.removeEventListener('message', awaitConsumer as any); // Remove this listener (there is no `socket.off`)
        this.subscribe(); // Subscribe to the client topic(s)
        this.socket.on('message', (msgData: Buffer) => this.onMessage(msgData)); // Connect the primary message listener

        // Reply to the client
        MessageBus.publish(this.topicServerToClient, <events.IClientAcknowledged>{
          type: events.TypeEnum.ClientAcknowledged,
          id: this.id,
        });

        // Announce new connection (completes any pending promises)
        MessageBus.publish(Topics.Connections, <events.IClientConnected>{
          type: events.TypeEnum.ClientConnected,
          id: this.id,
          topicInbound: this.topicServerFromClient,
          topicOutbound: this.topicServerToClient,
        });
      }
    };

    // Only listen for connection identifiers at this point
    logger.debug('Awaiting client ACK...');
    this.socket.on('message', awaitConsumer);
  }

  private subscribe() {
    if (this.id == null) {
      throw new Error('Cannot subscribe - no client id was negotiated yet');
    }
    this.subscribers.attach(this.topicServerToClient, (msg) => {
      logger.silly('Socket message sent %j', msg);
      this.send(msg);
    });

    this.pingPongHandler.subscribe({
      id: this.id,
      topicSend: this.topicServerToClient,
      topicReceive: this.topicServerFromClient,
    });

    // Begin pinging the client at regular intervals
    this.pingPongHandler.start(1000);
  }

  private unsubscribe() {
    if (this.id == null) {
      throw new Error('Cannot unsubscribe - no client id was negotiated yet');
    }
    this.subscribers.detachAll();
    this.pingPongHandler.stop();
    this.pingPongHandler.unsubscribe();
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

  send(message: any): void {
    const data = !ArrayBuffer.isView(message)
      ? encoder(message)
      : message;
    this.socket.send(data);
  }

  onMessage(data: Buffer) {
    const decoded = decoder(data);
    logger.silly('Socket message decoded %j', decoded);

    MessageBus.publish(this.topicServerFromClient, decoded);
  }

  close() {
    this.socket.close();
  }

  onClose(code: number, reason: string) {
    logger.info('Socket connection closed %j, %j', code, reason);

    // Only publish a disconnect event if this client managed to identify itself
    if (this.id != null) {
      this.unsubscribe();
      MessageBus.publish(Topics.Connections, <events.IClientDisconnected>{
        type: events.TypeEnum.ClientDisconnected,
        id: this.id,
        topicInbound: this.topicServerFromClient,
        topicOutbound: this.topicServerToClient,
      });
    }
  }
}

export { SocketClient as default };
