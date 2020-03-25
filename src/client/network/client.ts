import { v4 as uuid } from 'uuid';

import * as events from '../../common/events';
import { Consumer, MessageBus, Topics } from '../../common/messaging/bus';
import { decoder, encoder } from '../../common/messaging/serde';

const UNOPENED = -1;

class NetworkClient {
  private ws: WebSocket;
  private id: string;
  private clientAckTimeout: NodeJS.Timeout;

  private clientAckConsumer: Consumer;
  private publishToServerConsumer: Consumer;

  constructor(private url: string) {
    this.id = uuid();

    // The consumer reads any messages on NetworkOutbound topic
    // and sends them back out of the WebSocket.
    this.clientAckConsumer = (message: events.IEvent) => {
      if (message.type === events.TypeEnum.ClientAck) {
        this.onClientAck(message);
      }
    };
    this.publishToServerConsumer = (message: Uint8Array) => this.send(message);
  }

  getId() {
    return this.id;
  }

  // TODO: Implement proper client library, reconnect, durability, etc.
  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.addEventListener('open', resolve);
      this.ws.addEventListener('error', reject);

      this.ws.addEventListener('open', (e) => this.onOpen(e));
      this.ws.addEventListener('message', (e) => this.onMessage(e));
      this.ws.addEventListener('error', (e) => this.onError(e));
      this.ws.addEventListener('close', (e) => this.onClose(e));
    });
  }

  close() {
    return new Promise((resolve) => {
      if (!this.isClosed()) {
        this.ws.addEventListener('close', resolve);
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

  private onOpen(openEvent: Event) {
    console.log('Opened web socket', openEvent);

    // Subscribe us to receive any events targeting outbound network
    MessageBus.subscribe(Topics.ClientNetworkToServer, this.publishToServerConsumer);

    // Add a timeout for if this event doesn't get ack'd
    this.clientAckTimeout = setTimeout(() => {
      console.error('ClientAck not received in time - terminating connection');
      this.close();
    }, 2000);
    MessageBus.subscribe(Topics.ClientNetworkFromServer, this.clientAckConsumer);

    // Publish an event to the server that we have connected
    MessageBus.publish(Topics.ClientNetworkToServer, encoder(<events.IClientConnect>{
      type: events.TypeEnum.ClientConnect,
      id: this.id,
    }));
  }

  // TODO: Sending is awkward from other locations. Can we make it simpler?
  // Figure out how to create envelopes from incoming objects?
  private send(message: Uint8Array) {
    if (this.isConnected()) {
      if (!ArrayBuffer.isView(message)) {
        throw new Error(`message of unexpected type! ${typeof message}; ${JSON.stringify(message)}`);
      }
      this.ws.send(message);
    } else {
      console.warn('Dropped message send due to not being connected', message);
    }
  }

  private onClientAck(ack: events.IClientAck) {
    if (ack.id !== this.id) {
      this.close();
      throw new Error('Client ID mismatch! Disconnecting.');
    }

    console.log('ClientAck and ID match - away we go!');
    clearTimeout(this.clientAckTimeout);
    MessageBus.unsubscribe(Topics.ClientNetworkFromServer, this.clientAckConsumer);
    return this; // shut up linter
  }

  private onMessage(msgEvent: MessageEvent) {
    const data = new Uint8Array(msgEvent.data as ArrayBuffer);

    console.log('WebSocket message', data);

    // Decode the type of the message
    const message = decoder(data);
    console.log('Message decoded. Content:', message);

    // Push it out onto the network topic for listeners
    MessageBus.publish(Topics.ClientNetworkFromServer, message);
    return this; // shut up linter
  }

  private onClose(closeEvent: CloseEvent) {
    console.log('Closing web socket', closeEvent);

    // Clear any pending timers
    clearTimeout(this.clientAckTimeout);

    // Unsubscribe event handlers
    MessageBus.unsubscribe(Topics.ClientNetworkFromServer, this.clientAckConsumer);
    MessageBus.unsubscribe(Topics.ClientNetworkToServer, this.publishToServerConsumer);

    // Publish an event to the inbound listeners that we have disconnected
    MessageBus.publish(Topics.ClientNetworkFromServer, <events.IClientDisconnect>{
      type: events.TypeEnum.ClientDisconnect,
      id: this.id,
    });
    return this; // shut up linter
  }

  private onError(errorEvent: Event) {
    // This state change isn't very relevant since the WebSocket
    // communicates very little error information (by design, see MDN).
    // We can rely on the `close` event for everything and might even remove
    // this handler entirely.
    console.error('Web socket error', errorEvent);
    return this; // shut up linter
  }
}

export { NetworkClient as default };
