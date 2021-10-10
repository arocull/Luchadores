import ClientState from '../ClientState';
import { CalloutType, AnnouncerEvent, CalloutPriority } from './AnnouncerEvent';
import { SubscriberContainer } from '../../common/messaging/container';
import Fighter from '../../common/engine/Fighter';
import Sound from './Sound';
import SoundManager from './SoundManager';
import { fighterTypeToString } from '../../common/engine/Enums';
import RenderSettings from '../RenderSettings';

class Announcer {
  private timer: number = 0;
  private queue: AnnouncerEvent[] = [];
  private playing: Sound;

  private subscriptions: SubscriberContainer = new SubscriberContainer();

  constructor(private state: ClientState) {
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
    }

    // Append file location
    soundName = `Announcer/${soundName}`;
    this.playing = SoundManager.playSound(soundName); // Play actual sound
    if (this.playing === null) { return; } // If no sound was played, move on

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
}

export { Announcer as default };