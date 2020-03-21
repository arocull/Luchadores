import Fighter from '../../common/engine/Fighter';

class Animator {
  public SpriteSheet: HTMLImageElement;

  public FrameWidth: number;
  public FrameHeight: number;
  public Upscale: number;

  public frame: number;
  public row: number;

  public timer: number;
  public lastState: number;

  constructor(protected owner: Fighter) {
    this.SpriteSheet = new Image();
    this.SpriteSheet.src = `Sprites/${owner.Class}.png`;

    this.FrameWidth = 512;
    this.FrameHeight = 512;
    this.Upscale = 1.3;
    this.frame = 0;
    this.row = 0;

    this.timer = 0;
    this.lastState = 0;
  }

  Tick(DeltaTime: number) {
    let state = 0;
    if (this.owner.Velocity.lengthXY() > 2 || (this.lastState === 2 && this.owner.Velocity.lengthXY() > 1)) state = 2;
    else if (this.owner.Position.z > 0) state = 1;

    if (state !== this.lastState) this.timer = 0;

    if (state === 2 && this.owner.Position.z <= 0) this.timer += DeltaTime * (this.owner.Velocity.lengthXY() / 8);
    else this.timer += DeltaTime;

    switch (state) {
      case 1:
        this.frame = 2;
        this.row = 0;
        break;
      case 2:
        this.frame = Math.floor(this.timer * 4) % 4;
        this.row = 1;
        break;
      default:
        this.frame = Math.floor(this.timer * 2) % 2; // Idle animation
        this.row = 0;
    }

    this.lastState = state;
  }

  GetOwner(): Fighter {
    return this.owner;
  }
}

export { Animator as default };