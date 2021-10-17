import ClientState from '../ClientState';
import { CalloutType, AnnouncerEvent, CalloutPriority } from './AnnouncerEvent';
import { SubscriberContainer } from '../../common/messaging/container';
import Fighter from '../../common/engine/Fighter';
import Sound from './Sound';
import SoundManager from './SoundManager';
import { fighterTypeToGender, fighterTypeToString } from '../../common/engine/Enums';
import RenderSettings from '../RenderSettings';
import { FightObserver, ThreatObject } from '../../common/engine/combat/FightObserver';
import Camera from '../Camera';

const ObservationRate = 0.125; // How many seconds until next observation from the FightObserver
class Announcer {
  private timer: number = 0;
  private queue: AnnouncerEvent[] = [];
  private playing: Sound;

  private subscriptions: SubscriberContainer = new SubscriberContainer();

  private observer: FightObserver;
  private observationTimer: number = ObservationRate;
  private observedFighters: ThreatObject[];
  private observedBulletGroups: ThreatObject[];

  private soloIdle: number; // Time in seconds that the player appears to not be doing much
  private soloActive: number; // Time in seconds that the player has been active, scales with game time
  private soloDamage: number; // Previously stored amount of damage player has done
  private soloDrought: number; // Time in seconds player has not done any damage

  private calloutCooldown: number = 0; // Cooldown before another battle-relevant callout is made
  private soloCooldown: number = 0; // Cooldown of announced observations on local player
  private lastCallout: CalloutType = CalloutType.LethalPlan; // Last callout, prevents repeats

  constructor(private state: ClientState, private camera: Camera) {
    this.observer = new FightObserver(state.getWorld()); // TODO: Change if world changes?
    this.resetSoloData();

    this.subscriptions.attach('Announcer_Kill', (msg) => {
      this.eventKill(msg);
    });
  }

  /**
   * @function tick
   * @summary Ticks the Announcer
   */
  public tick(deltaTime: number) {
    if (!RenderSettings.EnableAnnouncer) { return; }
    this.timer -= deltaTime;

    this.calloutCooldown -= deltaTime;
    this.soloCooldown -= deltaTime;

    this.observationTimer -= deltaTime;
    if (this.observationTimer <= 0 && this.state.character) {
      this.observationTimer = ObservationRate;
      this.tickObserver();
    }

    if (this.state.character && this.soloCooldown <= 0) {
      const velo = this.getRelativeMomentum(this.state.character);
      if (velo > (2 / 3)) { // Lots of movement causes buildup in activity
        this.soloActive += velo * deltaTime * 1.5;
      } else if (velo < (1 / 3)) { // Little movement causes inactivity
        this.soloIdle += deltaTime * 0.7;
      }

      if (this.state.character.Firing) { // Firing weapons cause activity
        this.soloActive += deltaTime / 2;
      } // Not attacking is not exactly "inactive" (sheep, flamingo breathing)

      const dmg = this.state.character.DamageDealt;
      if (dmg > this.soloDamage) {
        this.soloActive += (dmg - this.soloDamage) / 10; // Damage counts towards being active!

        this.soloDrought = 0; // Reset damage drought
        this.soloDamage = dmg;
      } else { // Otherwise, increment damage drought
        this.soloDrought += deltaTime;
        if (this.soloDrought > 2) { // If we haven't done anything for over two full seconds, we may be a bit inactive
          this.soloIdle += deltaTime * 0.7;
        }
      }

      this.soloActive -= deltaTime; // Fast decay in activity
      this.soloIdle -= deltaTime / 2; // Slow decay in inactivity

      if (this.soloActive < 0) this.soloActive = 0;
      if (this.soloIdle < 0) this.soloIdle = 0;

      if (this.soloActive >= 7.1 && this.lastCallout !== CalloutType.Advance) {
        // this.queue.push(new AnnouncerEvent(CalloutType.Name, this.state.character, CalloutPriority.Low, 3, 0));
        this.queue.push(new AnnouncerEvent(CalloutType.Advance, this.state.character, CalloutPriority.Low, 4.3, 0.1));
        this.lastCallout = CalloutType.Advance;
        this.soloCooldown = 17;
        this.calloutCooldown = 4;
        this.resetSoloData();
      } else if (this.soloIdle >= 2.8 && this.soloActive < 1 && this.lastCallout !== CalloutType.LethalPlan) {
        this.queue.push(new AnnouncerEvent(CalloutType.LethalPlan, this.state.character, CalloutPriority.Low, 3, 0));
        this.lastCallout = CalloutType.LethalPlan;
        this.soloCooldown = 17;
        this.calloutCooldown = 4;
        this.resetSoloData();
      }
    } else { // Otherwise, reset player data
      this.resetSoloData();
    }

    if (this.queue.length > 0) {
      // Look through queue to manage priorities
      for (let i = 0; i < this.queue.length; i++) {
        this.queue[i].staleTimer -= deltaTime; // Count down stale timer
        if (this.queue[i].staleTimer <= 0) { // If the item is stale, don't play it
          this.queue.splice(i, 1);
          // eslint-disable-next-line no-continue
          continue;
        }

        // If we have a high-priority message, dump all other queued items and relay message
        if (this.queue[i].priority === CalloutPriority.Immediate) {
          this.queue.splice(0, i - 1); // Remove all items in queue up until the immediate one
          this.timer = 0;
          if (this.playing) {
            this.playing.stop();
          }
        } else if (i > 0) {
          // If this item has a higher priority than the last one
          if (this.queue[i].priority > this.queue[i - 1].priority) {
            this.queue.splice(i - 1, 1); // Remove previous item in queue
          }
        }
      }
    }

    if (this.timer <= 0 && this.queue.length > 0) {
      this.processEvent(this.queue.shift());
    }
  }

  private processEvent(event: AnnouncerEvent) {
    if (event === null) { return; }

    let soundName = '';

    // Pick audio file based off of the callout type and instigator
    switch (event.type) {
      case CalloutType.Title:
      default:
        soundName = 'Luchadores';
        break;
      case CalloutType.Name:
        soundName = `FighterName/${fighterTypeToString(event.instigator.getCharacter())}`;
        break;
      case CalloutType.Kill:
        soundName = `KillMethod/${fighterTypeToString(event.instigator.getCharacter())}`;
        break;
      case CalloutType.BuildTension:
        soundName = 'BattleCallouts/OhBuildingTension';
        break;
      case CalloutType.MustHurt:
        soundName = 'BattleCallouts/MustHurt';
        break;
      case CalloutType.Ouch:
        soundName = 'BattleCallouts/OhSympathetic';
        break;
      case CalloutType.Surprise:
        soundName = 'BattleCallouts/Surprise';
        break;
      case CalloutType.Intense:
        soundName = 'BattleCallouts/BattleTense';
        break;
      case CalloutType.Bullets:
        soundName = 'BattleCallouts/BulletsEverywhere';
        break;
      case CalloutType.Pursuit:
        soundName = 'BattleCallouts/FollowsQuickly';
        break;
      case CalloutType.Advance:
        soundName = 'BattleCallouts/AdvancesQuickly';
        break;
      case CalloutType.LethalPlan:
        soundName = `BattleCallouts/LethalPlan${fighterTypeToGender(event.instigator.getCharacter())}`;
        break;
    }

    // Append file location
    soundName = `Announcer/${soundName}`;
    this.playing = SoundManager.playSound(soundName); // Play actual sound
    if (this.playing === null) { return; } // If no sound was played, move on

    this.playing.src.volume = 0.6;
    const dur = this.playing.src.duration; // Get duration of audio

    // eslint-disable-next-line no-restricted-globals
    if (isNaN(dur) && isFinite(dur)) { // Make sure the audio doesn't last forever
      this.timer = this.playing.src.duration;
    } else { // Otherwise, default to 3 seconds as a safety measure
      this.timer = 3;
    }
  }

  private getFigherByID(fighterID: number) {
    const fighters = this.state.getWorld().Fighters;
    for (let i = 0; i < fighters.length; i++) {
      if (fighters[i].getOwnerID() === fighterID) {
        return fighters[i];
      }
    }

    return null;
  }

  /**
   * @function eventKill
   * @param {Fighter} killed Fighter that was killed
   */
  private eventKill(killed: Fighter) {
    if (killed.getOwnerID() === this.state.player.getCharacterID()) {
      this.queue.push(new AnnouncerEvent(CalloutType.Ouch, killed, CalloutPriority.Immediate, 2, 0.01));

      if (Math.random() > 0.35) {
        this.queue.push(new AnnouncerEvent(CalloutType.Kill, this.getFigherByID(killed.LastHitBy), CalloutPriority.High, 7));
        this.queue.push(new AnnouncerEvent(CalloutType.Name, killed, CalloutPriority.High, 7, 0.3));
      }
    } else if (killed.LastHitBy === this.state.player.getCharacterID()) {
      if (Math.random() > 0.6) {
        this.queue.push(new AnnouncerEvent(CalloutType.Surprise, this.state.character, CalloutPriority.Immediate, 2, 0.1));
      } else {
        this.queue.push(new AnnouncerEvent(CalloutType.MustHurt, this.state.character, CalloutPriority.Immediate, 2, 0.1));
      }
    } else {
      this.queue.push(new AnnouncerEvent(CalloutType.Kill, this.getFigherByID(killed.LastHitBy), CalloutPriority.Medium, 7));
      this.queue.push(new AnnouncerEvent(CalloutType.Name, killed, CalloutPriority.Medium, 7, 0.3));
    }
  }

  /**
   * @function eventCallout
   * @summary Performs a battle callout, if the timer has ended
   * @param {CalloutType} event Announcer voice line to produce, if performing callouts
   * @param {number} cooldown Time in seconds before next battle callout can be performed
   * @param {number} staleTimer Number of time in seconds before the event gets stale
   */
  private eventCallout(type: CalloutType, cooldown: number, staleTimer: number = 5) {
    if (this.calloutCooldown > 0 || this.lastCallout === type) { return; }

    this.queue.push(new AnnouncerEvent(type, null, CalloutPriority.Low, staleTimer, 0.05));
    this.calloutCooldown = cooldown; // TODO: Do we still induce cooldown if this callout goes stale?
    this.lastCallout = type;
  }

  public tickObserver() {
    // Get 3 most threatening fighters
    this.observedFighters = this.observer.GetThreateningFighters(this.state.character, this.state.getWorld().Fighters, 3, ObservationRate);

    // Calculate screen bounds for bullet grouping
    const leeway = Math.max(this.camera.getScreenWidth(), this.camera.getScreenHeight()) * 0.05;
    const botLeft = this.camera.ScreenToWorld(-leeway, -leeway);
    const topRight = this.camera.ScreenToWorld(this.camera.getScreenWidth() + leeway, this.camera.getScreenHeight() + leeway);

    // Vertical positions need to be flipped (upward is +Y)
    const flipY = botLeft.y;
    botLeft.y = topRight.y;
    topRight.y = flipY;

    // Get bullet groups on screen and corresponding threat levels
    const groups = this.observer.formProjectileGroups(botLeft, topRight);
    this.observedBulletGroups = this.observer.GetThreateningProjectileGroups(this.state.character, groups, groups.length, ObservationRate);

    // Tally threat level of bullets
    let totalThreatBullets = 0;
    for (let i = 0; i < this.observedBulletGroups.length; i++) {
      totalThreatBullets += this.observedBulletGroups[i].threat;
    }

    // Tally threat level of nearest fighters
    let totalThreatFighters = 0;
    for (let i = 0; i < this.observedFighters.length; i++) {
      totalThreatFighters += this.observedFighters[i].threat;
    }

    // Roughly estimate the intensity of the battle, more bullets = more intensity! And fighters are dangerous, too
    const totalThreat = totalThreatBullets * (this.observedBulletGroups.length / 5) + totalThreatFighters * 2;

    if (totalThreat >= 80 && this.observedFighters.length > 0) { // If this is a very intense battle, say so.
      this.eventCallout(CalloutType.Intense, 7.5);

      // If there is a lot of bullets on screen and we're in some danger, this may be a good time to panic!
    } else if (this.observedBulletGroups.length > 7 && totalThreatBullets >= 20) {
      this.eventCallout(CalloutType.Bullets, 9.5);
    }
  }

  /**
   * @function getRelativeMomentum
   * @summary Returns the current momentum of the given fighter, relative to their max momentum
   * @param {number} fighter Fighter to get relative momentum for
   * @returns {number} Relative momentum (0 to 1)
   */
  private getRelativeMomentum(fighter: Fighter): number {
    return fighter.getMomentumXY() / fighter.MaxMomentum;
  }

  /**
   * @function resetSoloData
   * @summary Resets counter data for solo player information
   */
  private resetSoloData() {
    this.soloIdle = 0;
    this.soloActive = 0;
    this.soloDamage = 0;
    this.soloDamage = 0;

    if (this.state.character) {
      this.soloDamage = this.state.character.DamageDealt;
    }
  }
}

export { Announcer as default };