// any imports go here

function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

test('simple async test', async () => {
  await sleep(250);
}, 2000);
