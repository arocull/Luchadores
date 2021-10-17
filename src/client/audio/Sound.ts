import Vector from '../../common/engine/Vector';

class Sound {
  public owner: any = null;
  public time: number = 0;
  public volume: number = 1; // Set volume of sound, for attenuation
  public position: Vector = new Vector(0, 0, 0); // 3D position of sound, for attenuation
  constructor(public src: HTMLAudioElement) { }

  /**
   * @function play
   * @summary Plays the given audio and resets the timer
   * @param {any} owner The owner of the sound, set to null for none
   */
  public play(owner: any = null) {
    this.owner = owner;
    this.time = 0; // Reset time so we know this sound is freshly played
    this.src.currentTime = 0;
    this.src.play();
  }

  /**
   * @function stop
   * @summary Stops the audio playback and resets the position
   */
  public stop() {
    // this.time = 1000 // Make the sound old so it can be played again
    this.src.pause();
    this.src.currentTime = 0;
  }

  /**
   * @function stopOwner
   * @summary Stops this audio if it is owned by the given object
   */
  public stopOwner(owner: any) {
    if (owner === this.owner) {
      this.stop();
    }
  }
}

export { Sound as default };