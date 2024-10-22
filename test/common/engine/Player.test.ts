import Player from '../../../src/common/engine/Player';

describe('Player', () => {
  it('should have no ping at initialization', () => {
    const conn = new Player('asdf');
    conn.setUsername('asdf');
    expect(conn.getPing()).toBeNull();
  });

  it('should push pings to the queue', () => {
    const conn = new Player('asdf');
    conn.setUsername('asdf');

    conn.updatePing(123);
    expect(conn.getPing()).toEqual(123);
  });

  it('should average pings', () => {
    const conn = new Player('asdf');
    conn.setUsername('asdf');

    conn.updatePing(123);
    conn.updatePing(400);
    expect(conn.getPing()).toEqual((123 + 400) / 2);
  });

  it('should purge old pings', () => {
    const conn = new Player('asdf');
    conn.setUsername('asdf');

    conn.updatePing(123);
    conn.updatePing(400);

    for (let i = 0; i < 28; i++) {
      conn.updatePing(400);
    }
    expect(conn.getPing()).toEqual(390.76666666666665);
    expect(conn.getPingHistory().length).toEqual(30);

    conn.updatePing(400);
    expect(conn.getPing()).toEqual(400);
    expect(conn.getPingHistory().length).toEqual(30);
  });
});
