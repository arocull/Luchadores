// By default the global WebSocket object is stubbed out
// https://www.npmjs.com/package/mock-socket
import { WebSocket, Server } from 'mock-socket'; // eslint-disable-line @typescript-eslint/no-unused-vars

import * as events from '../../../src/common/events/events';
import { decoder, encoder } from '../../../src/common/messaging/serde';
import { Consumer, MessageBus, Topics } from '../../../src/common/messaging/bus';
import NetworkClient from '../../../src/client/network/client';

const URL = 'ws://mock-host:3000';
const server = new Server(URL); // eslint-disable-line @typescript-eslint/no-unused-vars
let client: NetworkClient;

afterEach(() => {
  if (client) {
    client.close();
  }
  client = null;
  MessageBus.clearSubscribers();
});

test('connection success completes promise', async () => {
  client = new NetworkClient(URL);
  expect(client.isClosed()).toBeTruthy();
  expect(client.isClosing()).toBeFalsy();
  expect(client.isConnecting()).toBeFalsy();
  expect(client.isConnected()).toBeFalsy();

  const promiseConnect = client.connect();
  expect(client.isClosed()).toBeFalsy();
  expect(client.isClosing()).toBeFalsy();
  expect(client.isConnecting()).toBeTruthy();
  expect(client.isConnected()).toBeFalsy();

  await promiseConnect;
  expect(client.isClosed()).toBeFalsy();
  expect(client.isClosing()).toBeFalsy();
  expect(client.isConnecting()).toBeFalsy();
  expect(client.isConnected()).toBeTruthy();

  const promiseClose = client.close();
  expect(client.isClosed()).toBeFalsy();
  expect(client.isClosing()).toBeTruthy();
  expect(client.isConnecting()).toBeFalsy();
  expect(client.isConnected()).toBeFalsy();

  await promiseClose;
  expect(client.isClosed()).toBeTruthy();
  expect(client.isClosing()).toBeFalsy();
  expect(client.isConnecting()).toBeFalsy();
  expect(client.isConnected()).toBeFalsy();
});

test('connection failure rejects promise', async () => {
  try {
    client = new NetworkClient('ws://some-bunk-url:3000');
    await client.connect();
    fail('Should have rejected');
  } catch (err) {
    expect(err).not.toBeNull();
  }
});

test('send and receive messages', async () => {
  client = new NetworkClient(URL);

  const messagesReceivedByServer: any[] = [];
  const serverSentMessage: Promise<void> = new Promise((resolve, reject) => {
    server.on('connection', (socket) => {
      socket.on('message', (msg: ArrayBuffer) => {
        const decoded = decoder(msg);
        messagesReceivedByServer.push(decoded);

        if (decoded instanceof events.client.ClientConnect) {
          const encoded = encoder(<events.client.IClientConnect>{
            type: events.core.TypeEnum.ClientConnect,
            id: 'got it',
          });

          // Some kind of weirdness is going on in mock-socket
          // with the difference between Node's Buffer type
          // and ArrayBuffer / Uint8Array. If we don't manually
          // convert the type over like this, it returns us back
          // an empty Uint8Array on the other side.
          //
          // https://github.com/thoov/mock-socket/issues/6#issuecomment-602102569
          const newBuffer = new ArrayBuffer(encoded.byteLength);
          const newBufferView = new Uint8Array(newBuffer);
          newBufferView.set(encoded, 0);
          socket.send(newBuffer);

          resolve();
        } else {
          reject(new Error(`Wrong message type! ${JSON.stringify(decoded)}`));
        }
      });
    });
  });

  const messagesFromServer: any[] = [];
  const messagesToServer: any[] = [];
  const consumerFromServer: Consumer = {
    receive: (msg) => {
      messagesFromServer.push(msg);
    },
  };
  const consumerToServer: Consumer = {
    receive: (msg) => {
      messagesToServer.push(msg);
    },
  };
  MessageBus.subscribe(Topics.NetworkFromServer, consumerFromServer);
  MessageBus.subscribe(Topics.NetworkToServer, consumerToServer);

  await client.connect();

  console.log(messagesFromServer);
  expect(messagesFromServer.length).toBe(1);
  expect(messagesFromServer[0].type).toBe(events.core.TypeEnum.ClientConnect);

  expect(messagesToServer.length).toBe(1);
  expect(messagesToServer[0] instanceof Uint8Array).toBe(true);

  await serverSentMessage;
  expect(messagesReceivedByServer.length).toBe(1);
  expect(messagesReceivedByServer[0].type).toBe(events.core.TypeEnum.ClientConnect);
  expect(messagesReceivedByServer[0].id).not.toBeNull(); // client generated uuid

  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(messagesFromServer.length).toBe(2);
  expect(messagesFromServer[1].type).toBe(events.core.TypeEnum.ClientConnect);
  expect(messagesFromServer[1].id).toBe('got it'); // server sent uuid
});
