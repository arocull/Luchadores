import { SubscriberContainer } from '../../common/messaging/container';
import { fighterTypeToString } from '../../common/engine/Enums';
import Vector from '../../common/engine/Vector';
import Sound from './Sound';
import SoundManager from './SoundManager';
import Camera from '../Camera';
import Entity from '../../common/engine/Entity';
import Player from '../../common/engine/Player';

class ClientAudioInit {
  private player: Player;
  private camera: Camera;

  private dropoff: number = 23; // Maximum distance a sound can be heard from
  private lastHurtSound: number = 0; // Time since last hurt sound

  private subscriptions: SubscriberContainer;
  private spatialAudio: Sound[] = [];

  constructor() {
    this.subscriptions = new SubscriberContainer();

    // Play a given sound at a given position
    this.subscriptions.attach('Audio_General', (obj: any) => {
      this.playSound(obj.sfxName, obj.pos, obj.vol, obj.owner || null);
    });

    // Play a user-interface sound
    this.subscriptions.attach('Audio_UI', (sfxName: string) => {
      SoundManager.playSound(sfxName);
    });


    // MORE SPECIFIC AUDIO //
    // Play sound when damage is taken
    this.subscriptions.attach('Audio_DamageTaken', (audioEvent: any) => {
      if (audioEvent.dmg > 0.03 && this.lastHurtSound > 0.85) {
        const sfx = SoundManager.playSound(`${fighterTypeToString(audioEvent.fighterType)}/Hurt`);
        sfx.src.volume = 0.5;
        this.lastHurtSound = 0;
      }
    });

    // Play a bullet whizz sound when our character gets hit by a bullet
    this.subscriptions.attach('Audio_BulletWhizz', (obj: any) => {
      if (obj.obj === this.player.getCharacter()) {
        this.playSound('BulletWhizz', obj.pos, 0.5, null);
      }
    });

    this.subscriptions.attach('PlayerReady', (plr: Player) => this.setPlayer(plr));
  }

  public setCamera(cam: Camera) {
    this.camera = cam;
  }

  public setPlayer(plr: Player) {
    this.player = plr;
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
   * Logarithmic Volume Formula: ln(-x + dropoff + 1) / ln(dropoff)
   * @param {string} sfxName Name of the sound to play
   * @param {Vector} position Position of the sound to play
   * @param {number} volume Base volume of the audio
   * @returns {Sound} Returns the sound element that was played
   */
  public playSound(sfxName: string, position: Vector, volume: number, owner: any = null): Sound {
    const dist = Vector.DistanceXY(position, this.camera.GetFocusPosition());
    if (dist >= this.dropoff * 2) return null; // Sound happened too far away, don't bother playing

    const sfx = SoundManager.playSound(sfxName, owner);
    if (sfx) {
      sfx.volume = volume;
      sfx.position = position;
      sfx.src.volume = this.attenuate(dist, volume);
      if (!this.spatialAudio.includes(sfx)) {
        this.spatialAudio.push(sfx);
      }
    }

    return sfx;
  }

  public stopSound(sfxName: string, owner: any = null) {
    SoundManager.stopSound(sfxName, owner);
  }

  /**
   * @function attenuateSound
   * @summary Attenuates a sound based off its distance to the camera, if it has an owner
   * @param sfx Sound to attenuate
   */
  private attenuateSound(sfx: Sound) {
    let pos: Vector = sfx.position; // Use last position of audio
    if (sfx.owner && sfx.owner instanceof Entity) { // Update it to the owner's position if present
      pos = sfx.owner.Position;
      // eslint-disable-next-line no-param-reassign
      sfx.position = pos;
    }

    // Get distance of sound from camera center for attenuation
    const dist: number = Vector.DistanceXY(pos, this.camera.GetFocusPosition());

    if (dist >= this.dropoff * 2) { // If the sound is far out of attenuation radius, go ahead and stop it
      sfx.stop();
      return;
    }

    // eslint-disable-next-line no-param-reassign
    sfx.src.volume = this.attenuate(dist, sfx.volume);
  }
  /**
   * @function attenuate
   * @summary Takes distance and volume and returns the attenuated volume of the sound
   * @param {number} dist Distance the audio is played from
   * @param {number} vol Normal volume of the audio
   * @returns {number} Attenuated volume of audio
   */
  private attenuate(dist: number, vol: number): number {
    return Math.max(Math.min((1 - dist / this.dropoff) * vol, 1), 0); // Linear formula, faster but drops off a lot sooner
  }

  /**
   * @function tick
   * @summary Ticks the ClientAudio by a given increment of time
   * @param {number} DeltaTime Change in time (in seconds)
   */
  public tick(DeltaTime: number) {
    this.lastHurtSound += DeltaTime;

    // For each spatial sound
    for (let i = 0; i < this.spatialAudio.length; i++) {
      if (this.spatialAudio[i].src.paused) { // If the audio is not playing, stop attenuating it
        this.spatialAudio.splice(i, 1);
        i--;
      } else { // Otherwise, attenuate it
        this.attenuateSound(this.spatialAudio[i]);
      }
    }
  }
}

const ClientAudio = new ClientAudioInit();
export { ClientAudio as default };