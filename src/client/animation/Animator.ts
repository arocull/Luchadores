import Vector from '../../common/engine/Vector';
import Fighter from '../../common/engine/Fighter';
import { FighterType } from '../../common/engine/Enums';
import { MessageBus } from '../../common/messaging/bus';
import { PFire } from '../particles/index';

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
  protected inUniqueIdle: boolean;

  public killEffectCountdown: number;

  constructor(protected owner: Fighter) {
    this.SpriteSheet = new Image();

    this.FrameWidth = 512;
    this.FrameHeight = 512;
    this.Upscale = 1;
    switch (owner.getCharacter()) {
      case FighterType.Sheep:
        this.SpriteSheet.src = 'Sprites/Sheep.png';
        this.Upscale = 1.3;
        break;
      case FighterType.Flamingo:
        this.SpriteSheet.src = 'Sprites/Flamingo.png';
        this.Upscale = 1;
        break;
      case FighterType.Deer:
        this.SpriteSheet = null;
        break;
      default:
    }

    this.frame = 0;
    this.row = 0;

    this.timer = 0;
    this.lastState = 0;
    this.timeToUniqueIdle = Math.random() * 13;

    this.killEffectCountdown = -1;
  }


  // Unique idle animation, different for every character with different effects hence its own seperate function
  protected triggerUniqueIdle() {
    this.frame = 6;
    this.row = 0;
    this.timer = 0;
    this.inUniqueIdle = true;
    this.timeToUniqueIdle = Math.random() * 13;
  }
  protected tickUniqueIdle() {
    if (this.timer >= 1) this.inUniqueIdle = false; // Idle timeout

    if (this.owner.getCharacter() === FighterType.Flamingo) {
      const fire = new PFire(
        Vector.Add(this.owner.Position, new Vector(
          (Math.random() - 0.5) * this.owner.Radius * 1.5,
          this.owner.Radius / 2,
          this.owner.Height * 0.75,
        )),
        new Vector(0, 0, 1),
        0.75,
      );
      MessageBus.publish('Effect_NewParticle', fire);
    }
  }

  public Tick(DeltaTime: number) {
    let state = 0;

    // If they are moving, set the state to that
    if (this.owner.Velocity.lengthXY() > 2 || (this.lastState === 2 && this.owner.Velocity.lengthXY() > 1)) state = 3;
    else if (this.owner.Position.z > 0.05) state = 2; // otherwise if they are in the air, display falling animation

    if (state === 0 && this.inUniqueIdle) state = 1; // If they are in a unique idle, then set idle to that
    else this.inUniqueIdle = false; // If unique idle was interrupted, stop it

    if (state !== this.lastState) this.timer = 0; // Reset animation timer if state has changed
    this.lastState = state;

    // If they are moving and on the ground, timer should increase at a rate proportional to their speed
    if (state === 3 && this.owner.Position.z <= 0) this.timer += DeltaTime * (this.owner.Velocity.lengthXY() / 8);
    else this.timer += DeltaTime;

    if (this.owner.inBulletCooldown()) { // If they are recovering from firing a bullet (likely shooting)
      if (state === 3) state = 5; // If moving, do a moving attack animation
      else state = 4; // Otherwise, do a standard attack
    }

    switch (state) {
      case 1: // Unique idle
        this.frame = (Math.floor(this.timer * 5) % 5) + 5;
        this.row = 0;
        this.tickUniqueIdle();
        break;

      case 2: // Falling animation
        this.frame = 6;
        if (this.owner.getCharacter() === FighterType.Flamingo) {
          this.row = 1;
        } else {
          this.row = 0;
        }
        break;

      case 3: // Move animation
        this.frame = Math.floor(this.timer * 10) % 10;
        this.row = 1;
        break;

      case 4: // Attack
        this.frame = Math.floor(this.timer * 5) % 5;
        this.row = 2;
        break;

      case 5: // Attack while moving
        this.frame = (Math.floor(this.timer * 5) % 5) + 5;
        this.row = 2;
        break;

      default: // Idle animation
        this.frame = Math.floor(this.timer * 5) % 5;
        this.row = 0;
        if (this.timer > this.timeToUniqueIdle) {
          this.triggerUniqueIdle();
        }
    }

    if (this.killEffectCountdown > 0) {
      this.killEffectCountdown -= DeltaTime;
      if (this.killEffectCountdown < 0) this.killEffectCountdown = 0;
    } else this.killEffectCountdown = -1;
  }
}

export { Animator as default };