class Map {
  public Texture: HTMLImageElement;

  constructor(public Width: number, public Height: number, public Friction: number, TextureSource: string) {
    this.Texture = new Image(2048, 2048);
    this.Texture.src = TextureSource;
  }
}

export { Map as default };
