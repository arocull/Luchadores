// By default the global WebSocket object is stubbed out
// https://www.npmjs.com/package/mock-socket
import { WebSocket, Server } from 'mock-socket'; // eslint-disable-line @typescript-eslint/no-unused-vars

import NetworkClient from '../../../src/client/network/client';

const URL = 'ws://mock-host:3000';
const server = new Server(URL); // eslint-disable-line @typescript-eslint/no-unused-vars
let client: NetworkClient;

afterEach(() => {
  if (client) {
    client.close();
  }
  client = null;
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

// TODO: Add tests for communication, message bus, etc
