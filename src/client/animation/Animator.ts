import Fighter from '../../common/engine/Fighter';

class Animator {
  public SpriteSheet: HTMLImageElement;

  public FrameWidth: number;
  public FrameHeight: number;
  public Upscale: number;

  public frame: number;
  public row: number;

  public timer: number;

  constructor(protected owner: Fighter) {
    this.SpriteSheet = new Image();
    this.SpriteSheet.src = `Sprites/${owner.Class}.png`;

    this.FrameWidth = 512;
    this.FrameHeight = 512;
    this.Upscale = 1.3;
    this.frame = 0;
    this.row = 0;

    this.timer = 0;
  }

  Tick(DeltaTime: number) {
    this.timer += DeltaTime;

    // const f = Math.floor(this.timer * 2) % 2;
    this.frame = Math.floor(this.timer * 2) % 2; // Idle animation
  }

  GetOwner(): Fighter {
    return this.owner;
  }
}

export { Animator as default };