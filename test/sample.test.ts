import * as _ from 'lodash';

interface MyInterface {
  Host: string;
  Port: number;
  Enabled: boolean;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

test('simple async test', async () => {
  await sleep(250);
}, 2000);

test('defaults deep test', () => {
  const opt : MyInterface = _.defaultsDeep({}, {
    Host: '127.0.0.1',
    Port: 1337,
    Enabled: false,
  });

  expect(opt.Host).toBe('127.0.0.1');
  expect(opt.Port).toBe(1337);
  expect(opt.Enabled).toBe(false);
});
