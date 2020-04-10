import { v4 as uuid } from 'uuid';

import * as events from '../../common/events';
import { Consumer, MessageBus, Topics } from '../../common/messaging/bus';
import { decoder, encoder } from '../../common/messaging/serde';

const UNOPENED = -1;

class NetworkClient {
  private ws: WebSocket;
  private _id: string;
  private _topicClientToServer: string;
  private _topicClientFromServer: string;

  private publishToServerConsumer: Consumer;

  constructor(private url: string) {
    this.id = uuid();

    // The consumer reads any messages on NetworkOutbound topic
    // and sends them back out of the WebSocket.
    this.publishToServerConsumer = (message: any) => this.send(message);
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
  connect(): Promise<void> {
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
          if (message.type === events.TypeEnum.ClientConnect) {
            if (message.id === this.id) {
              return message;
            }
          }
          return null;
        })
        .then(() => resolve())
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
      type: events.TypeEnum.ClientConnect,
      id: this.id,
    });

    // Add a timeout for if this event doesn't get ack'd
    MessageBus.await(this.topicClientFromServer, 2000, (message: events.IEvent) => {
      if (message.type === events.TypeEnum.ClientAck) {
        if (message.id === this.id) {
          console.log('ClientAck and ID match - away we go!');

          // Subscribe us to receive any events targeting outbound network
          MessageBus.subscribe(this.topicClientToServer, this.publishToServerConsumer);

          // Publish the new connection event to complete the connection after ack
          MessageBus.publish(Topics.Connections, <events.IClientConnect>{
            type: events.TypeEnum.ClientConnect,
            id: this.id,
          });
          return message;
        }
        console.error('Client ID mismatch! Disconnecting.');
        this.close();
        return message;
      }
      return null;
    }).catch((err) => {
      console.error('Client never ACK\'d. Disconnecting.', err);
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
    MessageBus.unsubscribe(this.topicClientToServer, this.publishToServerConsumer);

    // Publish an event to the inbound listeners that we have disconnected
    MessageBus.publish(Topics.Connections, <events.IClientDisconnect>{
      type: events.TypeEnum.ClientDisconnect,
      id: this.id,
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
