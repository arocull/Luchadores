import { v4 as uuid } from 'uuid';

import * as events from '../../common/events';
import { SubscriberContainer } from '../../common/messaging/container';
import { MessageBus, Topics } from '../../common/messaging/bus';
import { decoder, encoder } from '../../common/messaging/serde';
import { PingPongHandler } from '../../common/network/pingpong';

const UNOPENED = -1;

class NetworkClient {
  private ws: WebSocket;
  private _id: string;
  private _topicClientToServer: string;
  private _topicClientFromServer: string;
  private pingPongHandler: PingPongHandler;
  private subscribers: SubscriberContainer;

  constructor(private url: string) {
    this.id = uuid();
    this.pingPongHandler = new PingPongHandler();
    this.subscribers = new SubscriberContainer();
  }

  get id() {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
    this._topicClientToServer = `client-to-server-${value}`;
    this._topicClientFromServer = `client-from-server-${value}`;
  }

  get topicClientToServer() {
    return this._topicClientToServer;
  }

  get topicClientFromServer() {
    return this._topicClientFromServer;
  }

  // TODO: Implement proper client library, reconnect, durability, etc.
  connect(): Promise<events.IClientConnected> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.addEventListener('open', (e) => this.onOpen(e));
      this.ws.addEventListener('message', (e) => this.onMessage(e));
      this.ws.addEventListener('error', (e) => this.onError(e));
      this.ws.addEventListener('close', (e) => this.onClose(e));

      // Do not resolve the promise until we see the client connection event
      this.ws.addEventListener('error', () => reject(new Error('The connection had an error')));
      this.ws.addEventListener('close', () => reject(new Error('The connection closed when attempting to connect')));
      MessageBus.await(Topics.Connections, 2000,
        (message: events.IEvent) => {
          if (message.type === events.TypeEnum.ClientConnected) {
            if (message.id === this.id) {
              return message;
            }
          }
          return null;
        })
        .then((connected) => resolve(connected))
        .catch((err) => reject(err)); // Timeout
    });
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isClosed()) {
        this.ws.addEventListener('close', () => resolve());
        this.ws.close();
      } else {
        resolve();
      }
    });
  }

  /**
   * See the documented list of constants at
   * https://developer.mozilla.org/en-US/docs/Web/API/WebSocket#Constants
   */
  private get state() {
    if (this.ws == null) {
      return UNOPENED;
    }
    return this.ws.readyState;
  }

  isConnecting() {
    return this.state === WebSocket.CONNECTING;
  }

  isConnected() {
    return this.state === WebSocket.OPEN;
  }

  isClosing() {
    return this.state === WebSocket.CLOSING;
  }

  isClosed() {
    return this.state === UNOPENED
      || this.state === WebSocket.CLOSED;
  }

  /* eslint-disable no-console */
  private onOpen(openEvent: Event) {
    console.log('Opened web socket', openEvent);

    // Publish an event to the server that we have connected.
    // We have not yet connected the bus listener because the server hasn't ack'd,
    // so we send this using the internal send method.
    this.send({
      type: events.TypeEnum.ClientConnecting,
      id: this.id,
    });

    // It's OK to start listening for and responding to pings right away.
    // This will depend on the topics being wired up to the socket.
    this.pingPongHandler.subscribe({
      id: this.id,
      topicSend: this.topicClientToServer,
      topicReceive: this.topicClientFromServer,
    });

    MessageBus.await(this.topicClientFromServer, 2000,
      (message: events.IEvent) => {
        if (message.type === events.TypeEnum.ClientAcknowledged) {
          if (message.id === this.id) {
            return message;
          }
          this.close();
          throw new Error('Client ID mismatch! Disconnecting.');
        }
        return null;
      })
      .then(() => {
        console.log('ClientAck and ID match - away we go!');

        // Subscribe us to receive any events targeting outbound network.
        // Needed for outbound ping handler to work.
        this.subscribers.attach(this.topicClientToServer, (msg) => this.send(msg));

        // Start polling for pings at a regular interval.
        this.pingPongHandler.start(1000);

        // Publish the new connection event to complete the connection after ack
        MessageBus.publish(Topics.Connections, <events.IClientConnected>{
          type: events.TypeEnum.ClientConnected,
          id: this.id,
          topicInbound: this.topicClientFromServer,
          topicOutbound: this.topicClientToServer,
        });
      })
      .catch((err) => {
        console.error('Client handshake process failed. Disconnecting.', err);
        this.close();
      });
  }
  /* eslint-enable no-console */

  private send(message: any) {
    if (this.isConnected()) {
      const data = !ArrayBuffer.isView(message)
        ? encoder(message)
        : message;
      this.ws.send(data);
    } else {
      console.warn('Dropped message send due to not being connected', message);
    }
  }

  private onMessage(msgEvent: MessageEvent) {
    const data = new Uint8Array(msgEvent.data as ArrayBuffer);

    // Decode the type of the message
    const message = decoder(data);

    // Push it out onto the network topic for listeners
    MessageBus.publish(this.topicClientFromServer, message);
  }

  private onClose(closeEvent: CloseEvent) {
    console.log('Closing web socket', closeEvent);

    // Unsubscribe event handlers
    this.subscribers.detachAll();
    this.pingPongHandler.unsubscribe();
    this.pingPongHandler.stop();

    // Publish an event to the inbound listeners that we have disconnected
    MessageBus.publish(Topics.Connections, <events.IClientDisconnected>{
      type: events.TypeEnum.ClientDisconnected,
      id: this.id,
      topicInbound: this.topicClientFromServer,
      topicOutbound: this.topicClientToServer,
    });
  }

  private onError(errorEvent: Event) {
    // This state change isn't very relevant since the WebSocket
    // communicates very little error information (by design, see MDN).
    // We can rely on the `close` event for everything and might even remove
    // this handler entirely.
    console.error('Web socket error', errorEvent);
  }
}

export { NetworkClient as default };
