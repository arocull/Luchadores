class Map {
  public Texture: HTMLImageElement;

  // Width and height are respective boundaries of arena
  // Friction is how much the arena floor effects and slows down fighters
  // Texture Source is the source file of the map texture--ignored if set to an empty string
  // Wall Strength is the acceleration applied to fighters when outside the arena multiplied by how far out they are
  constructor(public Width: number, public Height: number, public Friction: number, TextureSource: string, private wallStrength: number = 50) {
    if (TextureSource === '') {
      this.Texture = null;
    } else if (TextureSource) {
      this.Texture = new Image(2048, 2048);
      this.Texture.src = TextureSource;
    }
  }

  public getWallStrength() {
    return this.wallStrength;
  }
}

export { Map as default };
