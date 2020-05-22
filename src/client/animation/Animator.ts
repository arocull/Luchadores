import Vector from '../../common/engine/Vector';
import RenderSettings from '../RenderSettings';
import Fighter from '../../common/engine/Fighter';
import { FighterType, fighterTypeToString } from '../../common/engine/Enums';
import { MessageBus } from '../../common/messaging/bus';
import {
  PFire, PSmoke, PBulletFire, PBulletShell,
} from '../particles/index';


enum AnimationState {
  Idle = 0,
  IdleUnique = 1,
  Falling = 2,
  Moving = 3,
  Attacking = 4,
  AttackingMoving = 5,
}


class Animator {
  public SpriteSheet: HTMLImageElement;

  public FrameWidth: number;
  public FrameHeight: number;
  public Upscale: number;

  public frame: number;
  public row: number;

  public timer: number;
  public timerTick: number;
  public lastState: AnimationState;
  private timeToUniqueIdle: number;
  private inUniqueIdle: boolean;
  private bulletTimer: number; // Used for keeping track of when last bullet was fired so we don't double-fire shells when appling world state updates

  public killEffectCountdown: number; // Ticks down until rose petals effects show after a kill

  private attackSpeed: number;

  constructor(protected owner: Fighter, private settings: RenderSettings) {
    this.SpriteSheet = new Image();
    this.SpriteSheet.src = `Sprites/${fighterTypeToString(owner.getCharacter())}.png`;

    this.FrameWidth = 512;
    this.FrameHeight = 512;
    this.Upscale = 1;
    this.attackSpeed = 1;
    switch (owner.getCharacter()) {
      case FighterType.Sheep:
        this.Upscale = 1.3;
        break;
      case FighterType.Deer:
        this.Upscale = 1.9;
        this.attackSpeed = 3;
        break;
      default:
    }

    this.frame = 0;
    this.row = 0;

    this.timer = 0;
    this.timerTick = 0;
    this.lastState = AnimationState.Idle;
    this.timeToUniqueIdle = Math.random() * 13;
    this.bulletTimer = 0;

    this.killEffectCountdown = -1;
  }


  // Unique idle animation, different for every character with different effects hence its own seperate function
  protected triggerUniqueIdle() {
    this.frame = 6;
    this.row = 0;
    this.timer = 0;
    this.inUniqueIdle = true;
    this.timeToUniqueIdle = 8 + Math.random() * 5;
  }

  // Tick special effects for unique idle animations
  protected tickUniqueIdle() {
    if (this.timer >= 1) this.inUniqueIdle = false; // Idle timeout

    if (this.owner.getCharacter() === FighterType.Flamingo && this.settings.nextParticle()) {
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

  // Tick special effects for when the entity is attacking
  protected tickAttacking() {
    // Deer - Fires bullet casings and the pow effects
    if (
      this.owner.getCharacter() === FighterType.Deer
      && this.owner.BulletShock > 0
      && (this.bulletTimer <= 0 || this.owner.inKillEffect()) // Prevent double-firing from world state updates
      && this.settings.nextParticle()
    ) {
      const fireDir = Vector.Multiply(this.owner.getAim(), -1);
      const firePos = Vector.Clone(this.owner.Position);
      firePos.z += this.owner.Height * (5 / 3);
      if (this.owner.Flipped === true) firePos.x -= this.owner.Radius;
      else firePos.x += this.owner.Radius;

      MessageBus.publish('Effect_NewParticle', new PBulletShell(firePos, fireDir));
      MessageBus.publish('Effect_NewParticle', new PBulletFire(firePos, fireDir, 1));

      this.bulletTimer = 0.05;

    // Flamingo - Fire on back and smoke breathing
    } else if (this.owner.getCharacter() === FighterType.Flamingo) {
      if (this.timerTick % 3 === 1 && this.settings.nextParticle()) {
        MessageBus.publish('Effect_NewParticle', new PFire(
          Vector.Add(this.owner.Position, new Vector(
            (Math.random() - 0.5) * this.owner.Radius * 1.4,
            this.owner.Radius / 2,
            this.owner.Height * 0.75,
          )),
          new Vector(0, 0, 1),
          0.75,
        ));
      } else if (this.timerTick % 5 === 4 && this.settings.nextParticle()) {
        let dir = 1;
        if (this.owner.Flipped === true) dir = -1;

        const pos = Vector.Clone(this.owner.Position);
        pos.z += this.owner.Height * 0.5;
        pos.x += this.owner.Radius * 1.2 * dir;
        pos.y -= 0.1;

        MessageBus.publish('Effect_NewParticle', new PSmoke(pos, new Vector(3 * dir, 0, -1.75), 1));
      }
    }
  }

  public Tick(DeltaTime: number) {
    let state = AnimationState.Idle;
    this.timerTick++;

    this.bulletTimer -= DeltaTime;

    // If they are moving, set the state to that
    if (this.owner.Velocity.lengthXY() > 2 || (this.lastState === 2 && this.owner.Velocity.lengthXY() > 1)) state = AnimationState.Moving;
    else if (this.owner.Position.z > 0.05 && !this.owner.riding) state = AnimationState.Falling; // otherwise if they are in the air, display falling animation

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

    switch (state) {
      case AnimationState.IdleUnique: // Unique idle
        this.frame = (Math.floor(this.timer * 5) % 5) + 5;
        this.row = 0;
        this.tickUniqueIdle();
        break;

      case AnimationState.Falling: // Falling animation
        this.frame = 6;
        if (this.owner.getCharacter() === FighterType.Flamingo) {
          this.row = 1;
        } else {
          this.row = 0;
        }
        break;

      case AnimationState.Moving: // Move animation
        this.frame = Math.floor(this.timer * 10) % 10;
        this.row = 1;
        break;

      case AnimationState.Attacking: // Attack
        this.frame = Math.floor(this.timer * 5 * this.attackSpeed) % 5;
        this.row = 2;
        this.tickAttacking();
        break;

      case AnimationState.AttackingMoving: // Attack while moving
        this.frame = (Math.floor(this.timer * 5) % 5) + 5;
        this.row = 2;
        this.tickAttacking();
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