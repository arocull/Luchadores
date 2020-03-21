// https://stackoverflow.com/a/56363362/97964
export interface Type<T> extends Function {
  new(...args: any[]): T;
}

export interface Handler<T> {
  (message: T): void;
}

export class MessageHandler<T> {
  constructor(private type: Type<T>, private handler: Handler<T>) {
  }

  isHandled(message: any) {
    return message instanceof this.type;
  }

  handle(message: T) {
    this.handler(message);
  }
}
