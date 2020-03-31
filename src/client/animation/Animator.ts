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
  protected timeToUniqueIdle: number;
  protected uniqueIdleLength: number;
  protected uniqueIdleFrame: number;

  public killEffectCountdown: number;

  constructor(protected owner: Fighter) {
    this.SpriteSheet = new Image();
    this.SpriteSheet.src = `Sprites/${owner.Class}.png`;

    if (owner.Class === 'Deer') this.SpriteSheet = null;

    if (owner.Class === 'Flamingo') {
      this.FrameWidth = 1024;
      this.FrameHeight = 1024;
      this.Upscale = 1;
    } else {
      this.FrameWidth = 512;
      this.FrameHeight = 512;
      this.Upscale = 1.3;
    }
    this.frame = 0;
    this.row = 0;

    this.timer = 0;
    this.lastState = 0;
    this.timeToUniqueIdle = Math.random() * 13;
    this.uniqueIdleLength = 0.5;
    this.uniqueIdleFrame = 2;

    this.killEffectCountdown = -1;
  }


  // Unique idle animation, different for every character with different effects hence its own seperate function
  protected UniqueIdle() {
    this.frame = this.uniqueIdleFrame;
    if (this.timer >= this.timeToUniqueIdle + this.uniqueIdleLength) {
      this.timer = 0;
      this.timeToUniqueIdle = Math.random() * 13;

      if (this.owner.Class === 'Flamingo') this.uniqueIdleFrame = 8;
      else this.uniqueIdleFrame = Math.floor(Math.random() * 0.6 + 0.5) + 2;
    }
  }

  public Tick(DeltaTime: number) {
    let state = 0;

    // If they are moving, set the state to that, otherwise if they are in the air, display falling animation
    if (this.owner.Velocity.lengthXY() > 2 || (this.lastState === 2 && this.owner.Velocity.lengthXY() > 1)) state = 2;
    else if (this.owner.Position.z > 0.05) state = 1;

    if (state !== this.lastState) this.timer = 0; // Reset animation timer if state has changed

    // If they are moving and on the ground, timer should increase at a rate proportional to their speed
    if (state === 2 && this.owner.Position.z <= 0) this.timer += DeltaTime * (this.owner.Velocity.lengthXY() / 8);
    else this.timer += DeltaTime;

    if (this.owner.Class === 'Flamingo') { // Currently flamingo has it's own animation states as it's spritesheet is a new format
      switch (state) {
        case 1: // Falling animation
          this.frame = 6;
          this.row = 1;
          break;
        case 2: // Move animation
          this.frame = Math.floor(this.timer * 10) % 10;
          this.row = 1;
          break;
        default: // Idle animation
          if (this.timer > this.timeToUniqueIdle) {
            this.UniqueIdle();
          } else this.frame = Math.floor(this.timer * 5) % 5;
          this.row = 0;
      }
    } else {
      switch (state) {
        case 1: // Falling animation
          this.frame = 2;
          this.row = 0;
          break;
        case 2: // Move animation
          this.frame = Math.floor(this.timer * 4) % 4;
          this.row = 1;
          break;
        default: // Idle animation
          if (this.timer > this.timeToUniqueIdle) {
            this.UniqueIdle();
          } else this.frame = Math.floor(this.timer * 2) % 2;
          this.row = 0;
      }
    }

    this.lastState = state;

    if (this.killEffectCountdown > 0) {
      this.killEffectCountdown -= DeltaTime;
      if (this.killEffectCountdown < 0) this.killEffectCountdown = 0;
    } else this.killEffectCountdown = -1;
  }
}

export { Animator as default };