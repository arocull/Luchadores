import AssetPreloader from '../AssetPreloader';

const libraryNames = [
  'BulletWhizz1',
  'BulletWhizz2',
  'BulletWhizz3',
  'BulletWhizz4',

  /* Hurt Sounds */
  'Sheep/Hurt1',
  'Sheep/Hurt2',
  'Sheep/Hurt3',
  'Deer/Hurt1',
  'Flamingo/Hurt1',
  'Flamingo/Hurt2',
  'Flamingo/Hurt3',

  /* Sheep Audio */

  /* Deer Audio */
  'Deer/Gunshot1',
  'Deer/Gunshot2',
  'Deer/Gunshot3',
  'Deer/Gunshot4',
  'Deer/Gunshot5',
  'Deer/Gunshot6',
  'Deer/Gunshot7',
  'Deer/Gunshot8',
  'Deer/Gunshot9',
  'Deer/Gunshot10',
  'Deer/Gunshot11',
  'Deer/Gunshot12',

  /* Flamingo Audio */
  'Flamingo/Inhale1',
  'Flamingo/Inhale2',
  'Flamingo/Inhale3',
  'Flamingo/Scream1',
  'Flamingo/Scream2',
  'Flamingo/Scream3',
  'Flamingo/Scream4',
  'Flamingo/Scream5',
  'Flamingo/Squawk1',
  'Flamingo/Squawk2',
  'Flamingo/Squawk3',
];

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
      const noNumbers: string = name.replace(/[0-9]/, '');
      AssetPreloader.getAudio(`Audio/${name}.mp3`).then((sfx) => {
        this.addLibrarySound(noNumbers, sfx);
      });
    });
  }

  public getLibrarySources(): string[] {
    const sources: string[] = [];

    libraryNames.forEach((name: string) => {
      sources.push(`Audio/${name}.mp3`);
    });

    return sources;
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
   * @todo Figure out mp3 + ogg alternates
   */
  public initialize() {
    if (this.enabled) return;
    this.enabled = true;

    this.addLibrarySounds(libraryNames);
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
    if (!sfxList) {
      console.log('Sound effect ', sfxName, ' not found!');
      return null;
    }
    const sfx = sfxList[Math.floor(sfxList.length * Math.random())]; // Pick random audio from list
    sfx.play();
    return sfx;
  }

  public enableAnnouncer() {
    this.addLibrarySounds([
      'Announcer/Luchadores1',
      'Announcer/FighterName/Sheep1',
      'Announcer/FighterName/Sheep2',
      'Announcer/FighterName/Deer1',
      'Announcer/FighterName/Deer2',
      'Announcer/FighterName/Flamingo1',
      'Announcer/FighterName/Flamingo2',
    ]);
  }
}

const SoundManager = new SoundManagerInit();

export { SoundManager as default };