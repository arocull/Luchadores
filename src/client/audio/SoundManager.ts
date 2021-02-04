import AssetPreloader from '../AssetPreloader';

/**
 * @class SoundManager
 * @summary Handles loading and playback of audio
 * @todo Find proper format to convert audio to for cross-platform compatibility
 */
class SoundManagerInit {
  /**
   * @property {Record<string, HTMLAduioElement[]>} lib
   * @summary Library, stores list of all sound names and corresponding HTMLAudioElement variants
   */
  private lib: Record<string, HTMLAudioElement[]>;
  private enabled: boolean = false;

  constructor() {
    this.lib = ({} as Record<string, HTMLAudioElement[]>);
  }

  /**
   * @function addLibrarySound
   * @summary Adds the given sound to the audio libary
   * @param {string} sfxName Name of sound
   * @param {HTMLAudioElement} sfx Sound effect itself
   */
  private addLibrarySound(sfxName: string, sfx: HTMLAudioElement) {
    if (!this.lib[sfxName]) this.lib[sfxName] = [sfx]; // Initialize array if not present
    else this.lib[sfxName].push(sfx); // Otherwise push it to end of array
  }

  /**
   * @function addLibrarySounds
   * @summary Loads all audio with given names. Removes numbers and indexes audio
   * @param {string[]} sfxNames List of audio names to load in
   */
  private addLibrarySounds(sfxNames: string[]) {
    sfxNames.forEach((name: string) => {
      const noNumbers: string = name.replace('.mp3', '').replace(/[0-9]/, '');
      AssetPreloader.getAudio(`Audio/${name}`).then((sfx) => {
        this.addLibrarySound(noNumbers, sfx);
      });
    });
  }

  /**
   * @function initialize
   * @summary Initializes SoundManager and begins downloading audio
   * @description
   * Audio is not automatically downloaded in the beginning to prevent
   * excessive use of data or internet. This might be changed later to
   * allow download of basic fight sound effects.
   *
   * However, announcer lines should not be downloaded unless the
   * announcer is enabled.
   */
  public initialize() {
    if (this.enabled) return;
    this.enabled = true;

    this.addLibrarySounds([
      'Luchadores1.mp3',
      'FighterName/Sheep1.mp3',
      'FighterName/Sheep2.mp3',
      'FighterName/Deer1.mp3',
      'FighterName/Deer2.mp3',
      'FighterName/Flamingo1.mp3',
      'FighterName/Flamingo2.mp3',
    ]);
  }

  /**
   * @function playSound
   * @summary Plays a sound variant with the given name from the audio library
   * @param {string} sfxName Name of sound to play
   * @returns {HTMLAudioElement} Sound that is currently being played
   */
  public playSound(sfxName: string): HTMLAudioElement {
    if (!this.enabled) return null;

    const sfxList = this.lib[sfxName]; // Get list of audio (multiple variants)
    const sfx = sfxList[Math.floor(sfxList.length * Math.random())]; // Pick random audio from list
    sfx.play();
    return sfx;
  }
}

const SoundManager = new SoundManagerInit();

export { SoundManager as default };