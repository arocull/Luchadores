import Fighter from './Fighter';

class Player {
  public Character: Fighter;
  public Ping: number;

  constructor(protected ID: number, protected Username: string) {
    this.Character = null;
    this.Ping = 0;
  }

  public GetPlayerID() {
    return this.ID;
  }
}

export { Player as default };