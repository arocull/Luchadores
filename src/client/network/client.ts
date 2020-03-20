import * as events from '../../common/events/events';
import decoder from '../../common/messaging/decoder';

const UNOPENED = -1;

class NetworkClient {
  private ws: WebSocket;

  constructor(private url: string) {
  }

  // TODO: Implement proper client library, reconnect, durability, etc.
  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.addEventListener('open', resolve);
      this.ws.addEventListener('error', reject);

      this.ws.addEventListener('open', this.onOpen);
      this.ws.addEventListener('message', this.onMessage);
      this.ws.addEventListener('error', this.onError);
      this.ws.addEventListener('close', this.onClose);
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
    // TODO: Consider emitting events to communicate this state change
    console.log('Opened web socket', openEvent);
    return this; // shut up linter
  }

  private onMessage(msgEvent: MessageEvent) {
    const data = new Uint8Array(msgEvent.data as ArrayBuffer);
    console.log('WebSocket message', data);

    // We can expect every message to be an Envelope
    const envelope = events.core.Envelope.decode(new Uint8Array(msgEvent.data));
    console.log('Envelope decoded', envelope.type, envelope.data);

    const message = decoder(envelope);
    console.log('Envelope decoded as', message.prototype.name);
    console.log('Message content', message);
    return this; // shut up linter
  }

  private onClose(closeEvent: CloseEvent) {
    // TODO: Consider emitting events to communicate this state change
    console.log('Closing web socket', closeEvent);
    return this; // shut up linter
  }

  private onError(errorEvent: Event) {
    // TODO: Consider emitting events to communicate this state change
    console.error('Closing web socket', errorEvent);
    return this; // shut up linter
  }
}

export { NetworkClient as default };
