import * as events from '../../common/events/events';

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

      this.ws.addEventListener('message', this.onMessage);
      this.ws.addEventListener('error', this.onError);
      this.ws.addEventListener('close', this.onClose);
    });
  }

  /**
   * See the documented list of constants at
   * https://developer.mozilla.org/en-US/docs/Web/API/WebSocket#Constants
   */
  private getReadyState() {
    if (this.ws == null) {
      return -1;
    }
    return this.ws.readyState;
  }

  isConnecting() {
    // CONNECTING
    return this.getReadyState() === 0;
  }

  isConnected() {
    // OPEN
    return this.getReadyState() === 1;
  }

  isClosed() {
    // `null` or CLOSED or CLOSING
    // No connection (null) is effectively a closed connection
    const state = this.getReadyState();
    return state === -1
      || state === 2
      || state === 3;
  }

  private onMessage(msgEvent: MessageEvent) {
    const data = new Uint8Array(msgEvent.data as ArrayBuffer);
    console.log('WebSocket message', data);

    // We can expect every message to be an Envelope
    const envelope = events.core.Envelope.decode(new Uint8Array(msgEvent.data));
    console.log('Envelope decoded', envelope.type, envelope.data);
    return this; // shut up linter
  }

  private onClose(closeEvent: CloseEvent) {
    console.log('Closing web socket', closeEvent);
    return this; // shut up linter
  }

  private onError(errorEvent: Event) {
    console.error('Closing web socket', errorEvent);
    return this; // shut up linter
  }
}

export { NetworkClient as default };
