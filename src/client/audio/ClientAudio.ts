import { MessageBus } from '../../common/messaging/bus';
import { fighterTypeToString } from '../../common/engine/Enums';
import Vector from '../../common/engine/Vector';
import SoundManager from './SoundManager';
import Client from '../ClientState';
import Camera from '../Camera';

class ClientAudio {
  private camera: Camera;

  private dropoff: number; // Maximum distance a sound can be heard from
  private dropoffPlusOne: number;
  private dropoffLN: number; // Logarithm of dropoff + 1

  private lastHurtSound: number = 0; // Time since last hurt sound

  constructor(private clientState: Client) {
    this.camera = clientState.camera;

    this.setDropOff(20);

    // Play sound when damage is taken
    MessageBus.subscribe('Audio_DamageTaken', (audioEvent: any) => {
      if (audioEvent.dmg > 0.03 && this.lastHurtSound > 1) {
        const sfx = SoundManager.playSound(`${fighterTypeToString(audioEvent.fighterType)}/Hurt`);
        sfx.volume = 0.3;
        this.lastHurtSound = 0;
      }
    });

    // Play a given sound at a given position
    MessageBus.subscribe('Audio_General', (obj: any) => {
      this.playSound(obj.sfxName, obj.pos, obj.vol);
    });
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
   */
  public playSound(sfxName: string, position: Vector, volume: number) {
    const dist = Vector.DistanceXY(position, this.camera.GetFocusPosition());
    if (dist >= this.dropoff) return; // Sound happened too far away, don't bother playing

    const sfx = SoundManager.playSound(sfxName);
    if (sfx) {
      // Math.log(-dist + this.dropoffPlusOne) / this.dropoffLN
      sfx.volume = Math.max(Math.min((1 - dist / this.dropoff) * volume, 1), 0);
    }
  }

  /**
   * @function tick
   * @summary Ticks the ClientAudio by a given increment of time
   * @param {number} DeltaTime Change in time (in seconds)
   */
  public tick(DeltaTime: number) {
    this.lastHurtSound += DeltaTime;
  }
}

export { ClientAudio as default };