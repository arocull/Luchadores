import Fighter from '../../common/engine/Fighter';
import { fighterTypeToString } from '../../common/engine/Enums';
import AssetPreloader from '../AssetPreloader';
import AnimationState from './AnimationState';
import { SubscriberContainer } from '../../common/messaging/container';
import { Consumer, MessageBus } from '../../common/messaging/bus';


class Animator {
  public SpriteSheet: HTMLImageElement;

  public FrameWidth: number;
  public FrameHeight: number;
  public Upscale: number;

  public frame: number;
  public row: number;

  public timer: number;
  public timerTick: number;
  protected globalTimer: number; // Non-animation dependent timer
  public lastState: AnimationState;
  protected realState: AnimationState;
  private timeToUniqueIdle: number;
  private inUniqueIdle: boolean;
  protected bulletTimer: number; // Used for keeping track of when last bullet was fired so we don't double-fire shells when appling world state updates

  public killEffectCountdown: number; // Ticks down until rose petals effects show after a kill
  /** Counts to 1 based off of current speed of character, then generates a burst of particles--resets to zero on idle, subtracts 1 upon particle burst */
  private moveTimer: number;
  /** Whether or not to do movement particles this tick */
  public doMoveParticle: boolean;

  protected animEvents: SubscriberContainer;

  constructor(protected owner: Fighter) {
    AssetPreloader.getImage(`Sprites/${fighterTypeToString(owner.getCharacter())}.png`).then((img) => {
      this.SpriteSheet = img;
    });

    this.FrameWidth = 512;
    this.FrameHeight = 512;
    this.Upscale = 1;

    this.frame = 0;
    this.row = 0;

    this.timer = 0;
    this.timerTick = 0;
    this.globalTimer = 0;

    this.lastState = AnimationState.Idle;
    this.timeToUniqueIdle = Math.random() * 13;
    this.bulletTimer = 0;

    this.killEffectCountdown = -1;
    this.moveTimer = 0;

    this.animEvents = new SubscriberContainer();
    this.animEvents.attach(`Animation_Suplexed${owner.getOwnerID()}`, this.suplexed);
  }
  /**
   * @function deconstruct
   * @summary Deconstructs the Animator. Unbinds animation events.
   * @virtual
   */
  public deconstruct() {
    this.animEvents.detachAll();
  }


  // Unique idle animation, different for every character with different effects hence its own seperate function
  protected triggerUniqueIdle() {
    this.frame = 6;
    this.row = 0;
    this.timer = 0;
    this.inUniqueIdle = true;
    this.timeToUniqueIdle = 8 + Math.random() * 5;
  }

  /* eslint-disable class-methods-use-this */
  protected tickUniqueIdle() {} // Tick special effects for when entity is in their unique idle state; overridden by subclasses
  protected tickAttacking() {} // Tick special effects for when entity is attacking; overriden by subclasses
  public destruct() {} // Removes bullet listeners
  /* eslint-enable class-methods-use-this */

  protected bindAnimEvent(eventName: string, consumer: Consumer) {
    this.animEvents.attach(`${eventName}${this.owner.getOwnerID()}`, consumer);
  }

  /**
   * @summary Takes input parameters and outputs an animation frame
   * @param {number} scale Time-scale for animation
   * @param {number} frames Number of frames to output
   * @param {number} alpha Time value to use for the animation frame
   * @returns {number} Outputted animation frame. Offset can be manually added
   */
  protected frameroll(scale: number = 5, frames: number = 5, alpha: number = this.timer): number {
    return Math.floor(alpha * scale) % frames;
  }

  protected frameIdle() {
    this.frame = this.frameroll(5, 5);
    this.row = 0;
  }
  protected frameIdleUnique() {
    this.frame = 5 + this.frameroll(5, 5);
    this.row = 0;
  }
  protected frameFalling() {
    this.frame = 6;
    this.row = 0;
  }
  protected frameMove() {
    this.frame = this.frameroll(10, 10);
    this.row = 1;
  }
  protected frameAttack() {
    this.frame = this.frameroll(5, 5);
    this.row = 2;
  }
  protected frameAttackMove() {
    this.frame = 5 + this.frameroll(5, 5);
    this.row = 2;
  }

  public Tick(DeltaTime: number) {
    this.timerTick++;
    this.bulletTimer -= DeltaTime;
    this.globalTimer += DeltaTime;

    switch (this.getAnimationState(DeltaTime)) {
      case AnimationState.IdleUnique: // Unique idle
        this.frameIdleUnique();
        this.tickUniqueIdle();
        this.moveTimer = 0;
        if (this.timer >= 1) this.inUniqueIdle = false; // Idle timeout
        break;

      case AnimationState.Falling: // Falling animation
        this.frameFalling();
        this.moveTimer += DeltaTime * this.owner.Velocity.length();
        break;

      case AnimationState.Moving: // Move animation
        this.frameMove();
        this.moveTimer += DeltaTime * this.owner.Velocity.length();
        break;

      case AnimationState.Attacking: // Attack
        this.frameAttack();
        this.tickAttacking();
        this.moveTimer = 0;
        break;

      case AnimationState.AttackingMoving: // Attack while moving
        this.frameAttackMove();
        this.tickAttacking();
        this.moveTimer += DeltaTime * this.owner.Velocity.length();
        break;

      default: // Idle animation
        this.frameIdle();
        this.moveTimer = 0;
        if (this.timer > this.timeToUniqueIdle) {
          this.triggerUniqueIdle();
        }
    }

    if (this.moveTimer > 3) {
      this.doMoveParticle = true;
      this.moveTimer -= 3;
    } else {
      this.doMoveParticle = false;
    }

    if (this.killEffectCountdown > 0) {
      this.killEffectCountdown -= DeltaTime;
      if (this.killEffectCountdown < 0) this.killEffectCountdown = 0;
    } else this.killEffectCountdown = -1;
  }

  private getAnimationState(DeltaTime: number): number {
    let state = AnimationState.Idle;

    // If they are moving, set the state to that
    if (this.owner.Velocity.lengthXY() > 2 || (this.lastState === 2 && this.owner.Velocity.lengthXY() > 1)) state = AnimationState.Moving;
    else if (this.owner.isFalling()) state = AnimationState.Falling; // otherwise if they are in the air, display falling animation

    if (state === AnimationState.Idle && this.inUniqueIdle) state = AnimationState.IdleUnique; // If they are in a unique idle, then set idle to that
    else this.inUniqueIdle = false; // If unique idle was interrupted, stop it

    if (state !== this.lastState) this.timer = 0; // Reset animation timer if state has changed
    this.lastState = state;

    // If they are moving and on the ground, timer should increase at a rate proportional to their speed
    if (state === AnimationState.Moving && this.owner.Position.z <= 0) this.timer += DeltaTime * (this.owner.Velocity.lengthXY() / 8);
    else this.timer += DeltaTime;

    if (this.owner.getBulletCooldown() > 0) { // If they are recovering from firing a bullet (likely shooting)
      if (state === 3) state = AnimationState.AttackingMoving; // If moving, do a moving attack animation
      else state = AnimationState.Attacking; // Otherwise, do a standard attack
    }

    this.realState = state;

    return state;
  }

  protected suplexed(event: any) {
    MessageBus.publish(`CameraShake${event.fighter.getOwnerID()}`, {
      amnt: Math.abs(event.velo),
      max: 13,
    });
  }
}

export { Animator as default };