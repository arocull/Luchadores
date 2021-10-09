import AssetPreloader from '../AssetPreloader';
import Sound from './Sound';

/**
 * @constant libraryNames
 * @summary Names of all default sound effects in game
 * @todo Remove hardcoding. Load a JSON?
 */
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
 * @constant announcerLibraryNames
 * @summary Names of all announcer sound effects in game
 * @todo Remove hardcoding. Load a JSON?
 */
const announcerLibraryNames = [
  'Announcer/Luchadores1',
  'Announcer/FighterName/Sheep1',
  'Announcer/FighterName/Sheep2',
  'Announcer/FighterName/Deer1',
  'Announcer/FighterName/Deer2',
  'Announcer/FighterName/Flamingo1',
  'Announcer/FighterName/Flamingo2',
];

/**
 * @class SoundManager
 * @summary Handles loading and playback of audio
 * @todo Find proper format to convert audio to for cross-platform compatibility
 */
class SoundManagerInit {
  /**
   * @property {Record<string, Sound[]>} lib
   * @summary Library, stores list of all sound names and corresponding HTMLAudioElement variants
   */
  private lib: Record<string, Sound[]>;
  private enabled: boolean = false;

  constructor() {
    this.lib = ({} as Record<string, Sound[]>);
  }

  /**
   * @function addLibrarySound
   * @summary Adds the given sound to the audio library
   * @param {string} sfxName Name of sound
   * @param {HTMLAudioElement} sfx Sound effect itself
   */
  private addLibrarySound(sfxName: string, sfx: HTMLAudioElement) {
    const sound: Sound = new Sound(sfx);

    if (!this.lib[sfxName]) this.lib[sfxName] = [sound]; // Initialize array if not present
    else this.lib[sfxName].push(sound); // Otherwise push it to end of array
  }

  /**
   * @function addLibrarySounds
   * @summary Loads all audio with given names. Removes numbers and indexes audio
   * @param {string[]} sfxNames List of audio names to load in
   * @todo Support alternative sound formats depending on platform
   */
  private addLibrarySounds(sfxNames: string[]) {
    sfxNames.forEach((name: string) => {
      const noNumbers: string = name.replace(/[0-9]/, '');
      AssetPreloader.getAudio(`Audio/${name}.mp3`)
        .then((sfx) => {
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
   * @function enableAnnouncer
   * @summary Loads in announced sound library
   */
  public enableAnnouncer() {
    this.addLibrarySounds(announcerLibraryNames);
  }

  /**
   * @function tick
   * @summary Ticks all sound ages
   * @param {number} deltaTime Time passed since last frame
   */
  public tick(deltaTime: number) {
    Object.entries(this.lib).forEach(([, sfxList]) => {
      sfxList.forEach((sfx) => {
        // eslint-disable-next-line no-param-reassign
        sfx.time += deltaTime;
      });
    });
  }

  /**
   * @function playSound
   * @summary Plays a sound variant with the given name from the audio library
   * @param {string} sfxName Name of sound to play
   * @returns {Sound} Sound that is currently being played
   */
  public playSound(sfxName: string, owner: any = null): Sound {
    if (!this.enabled) return null;

    const sfxList = this.lib[sfxName]; // Get list of audio (multiple variants)
    if (!sfxList) {
      console.error('Sound effect ', sfxName, ' not found!');
      return null;
    }

    sfxList.sort(this.SoundSort); // Sort so the oldest sound is on top, to reduce chance of interrupting sounds
    console.log(sfxList);
    const sfx = sfxList[0]; // Play first sound
    sfx.play(owner);

    return sfx;
  }

  public stopSound(sfxName: string, owner: any = null) {
    const sfxList = this.lib[sfxName];
    if (!sfxList) { // Sound library doesn't exist, return
      return;
    }

    if (owner) { // If we were given an owner object, only stop sounds owned by that object
      sfxList.forEach((element) => {
        element.stopOwner(owner);
      });
    } else { // Otherwise, stop all relevant sounds
      sfxList.forEach((element) => {
        element.stop();
      });
    }
  }

  private SoundSort(a: Sound, b: Sound): number {
    if (a.time < b.time) return 1;
    if (a.time > b.time) return -1;
    return 0;
  }
}

const SoundManager = new SoundManagerInit();

export { SoundManager as default };