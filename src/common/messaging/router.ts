import MessageHandler from './handler';

class MessageRouter {
  private handlers: MessageHandler<any>[];

  constructor() {
    this.handlers = [];
  }

  addHandler(handler: MessageHandler<any>) {
    this.handlers.push(handler);
  }

  removeHandler(handler: MessageHandler<any>) {
    this.handlers = this.handlers.filter((x) => x !== handler);
  }

  clearHandlers() {
    this.handlers = [];
  }

  emit(message: any) {
    // Would prefer to use for ... of syntax, but eslint complains
    for (let i = 0; i < this.handlers.length; i++) {
      const handler = this.handlers[i];
      if (handler.isHandled(message)) {
        handler.handle(message);
      }
    }
  }
}

export { MessageRouter as default };
