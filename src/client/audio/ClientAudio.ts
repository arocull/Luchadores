import { SubscriberContainer } from '../../common/messaging/container';
import { FighterType, fighterTypeToString } from '../../common/engine/Enums';
import Vector from '../../common/engine/Vector';
import SoundManager from './SoundManager';
import Client from '../ClientState';
import Camera from '../Camera';

class ClientAudioInit {
  private clientState: Client;
  private camera: Camera;

  private dropoff: number; // Maximum distance a sound can be heard from
  private dropoffPlusOne: number;
  private dropoffLN: number; // Logarithm of dropoff + 1

  private lastHurtSound: number = 0; // Time since last hurt sound

  private subscriptions: SubscriberContainer;

  // Character watching
  private lastSpecialBoolean: boolean;

  constructor() {
    this.subscriptions = new SubscriberContainer();

    this.setDropOff(20);

    // Play sound when damage is taken
    this.subscriptions.attach('Audio_DamageTaken', (audioEvent: any) => {
      if (audioEvent.dmg > 0.03 && this.lastHurtSound > 1) {
        const sfx = SoundManager.playSound(`${fighterTypeToString(audioEvent.fighterType)}/Hurt`);
        sfx.volume = 0.3;
        this.lastHurtSound = 0;
      }
    });

    // Play a given sound at a given position
    this.subscriptions.attach('Audio_General', (obj: any) => {
      this.playSound(obj.sfxName, obj.pos, obj.vol);
    });
  }

  public setClientState(owningState: Client) {
    this.clientState = owningState;
    this.camera = owningState.camera;
  }

  /**
   * @function setDropOff
   * @summary Calculates constants for distance volume controls
   * @param {number} newDropOff Maximum distance, in units, a sound can be heard from
   */
  public setDropOff(newDropOff: number) {
    this.dropoff = newDropOff;
    this.dropoffPlusOne = newDropOff + 1;
    this.dropoffLN = Math.log(newDropOff);
  }

  /**
   * @function playSound
   * @summary Plays a sound from a given position
   * @description
   * This mirrors the SoundManager.playSound, but also uses a positional input
   * to determine sound drop-off.
   * Surround sound imitation.
   *
   * Linear Volume Formula: 1 - x / dropoff
   * Logarithmic Volume Formula: ln(-x + dropoff + 1) / 3.045
   * @param {string} sfxName Name of the sound to play
   * @param {Vector} position Position of the sound to play
   * @param {number} volume Base volume of the audio
   * @returns {HTMLAudioElement} Returns the sound element that was played
   */
  public playSound(sfxName: string, position: Vector, volume: number): HTMLAudioElement {
    const dist = Vector.DistanceXY(position, this.camera.GetFocusPosition());
    if (dist >= this.dropoff) return null; // Sound happened too far away, don't bother playing

    const sfx = SoundManager.playSound(sfxName);
    if (sfx) {
      // Math.log(-dist + this.dropoffPlusOne) / this.dropoffLN
      sfx.volume = Math.max(Math.min((1 - dist / this.dropoff) * volume, 1), 0);
    }

    return sfx;
  }

  /**
   * @function tick
   * @summary Ticks the ClientAudio by a given increment of time
   * @param {number} DeltaTime Change in time (in seconds)
   */
  public tick(DeltaTime: number) {
    this.lastHurtSound += DeltaTime;

    // eslint-disable-next-line prefer-destructuring
    const character = this.clientState.character;
    if (character) {
      if (character.getSpecialBoolean() !== this.lastSpecialBoolean) {
        this.lastSpecialBoolean = character.getSpecialBoolean();

        // If flamingo switched from true to false, they stopped breathing and their attack has recharged
        if (character.getCharacter() === FighterType.Flamingo && this.lastSpecialBoolean === false) {
          SoundManager.playSound('Flamingo/Inhale');
        }
      }
    }
  }
}

const ClientAudio = new ClientAudioInit();
export { ClientAudio as default };