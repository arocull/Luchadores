import { has } from 'lodash';
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

  /* Sheep Audio */
  'Sheep/Hurt1',
  'Sheep/Hurt2',
  'Sheep/Hurt3',
  'Sheep/bound1',
  'Sheep/bound2',
  'Sheep/bound3',
  'Sheep/relax1',
  'Sheep/relax2',
  'Sheep/relax3',
  'Sheep/hit1',
  'Sheep/hit2',
  'Sheep/hit3',
  'Sheep/hit4',
  'Sheep/hit5',
  'Sheep/hum1',
  'Sheep/hum2',
  'Sheep/hum3',
  'Sheep/kill1',
  'Sheep/kill2',
  'Sheep/kill3',

  /* Deer Audio */
  'Deer/Hurt1',
  'Deer/Hurt2',
  'Deer/Hurt3',
  'Deer/Hurt4',
  'Deer/bound1',
  'Deer/bound2',
  'Deer/idle1',
  'Deer/idle2',
  'Deer/idle3',
  'Deer/kill1',
  'Deer/kill2',
  'Deer/kill3',
  'Deer/shoot1',
  'Deer/shoot2',
  'Deer/shoot3',
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
  'Flamingo/Hurt1',
  'Flamingo/Hurt2',
  'Flamingo/Hurt3',
  'Flamingo/bound1',
  'Flamingo/bound2',
  'Flamingo/bound3',
  'Flamingo/bound4',
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
  'Flamingo/kill1',
  'Flamingo/kill2',
  'Flamingo/kill3',
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

  'Announcer/KillMethod/Sheep1',
  'Announcer/KillMethod/Sheep2',
  'Announcer/KillMethod/Deer1',
  'Announcer/KillMethod/Deer2',
  'Announcer/KillMethod/Flamingo1',
  'Announcer/KillMethod/Flamingo2',

  'Announcer/BattleCallouts/AdvancesQuickly1',
  'Announcer/BattleCallouts/AdvancesQuickly2',
  'Announcer/BattleCallouts/AdvancesQuickly3',
  'Announcer/BattleCallouts/BattleTense1',
  'Announcer/BattleCallouts/BattleTense2',
  'Announcer/BattleCallouts/BulletsEverywhere1',
  'Announcer/BattleCallouts/BulletsEverywhere2',
  'Announcer/BattleCallouts/BulletsEverywhere3',
  'Announcer/BattleCallouts/FollowsQuickly1',
  'Announcer/BattleCallouts/FollowsQuickly2',
  'Announcer/BattleCallouts/LethalPlanHe1',
  'Announcer/BattleCallouts/LethalPlanShe1',
  'Announcer/BattleCallouts/LethalPlanThey1',
  'Announcer/BattleCallouts/OhBuildingTension1',
  'Announcer/BattleCallouts/OhBuildingTension2',
  'Announcer/BattleCallouts/OhBuildingTension3',
  'Announcer/BattleCallouts/OhSympathetic1',
  'Announcer/BattleCallouts/OhSympathetic2',
  'Announcer/BattleCallouts/OhSympathetic3',
  'Announcer/BattleCallouts/OhSympathetic4',
  'Announcer/BattleCallouts/MustHurt1',
  'Announcer/BattleCallouts/MustHurt2',
  'Announcer/BattleCallouts/MustHurt3',
  'Announcer/BattleCallouts/MustHurt4',
  'Announcer/BattleCallouts/Surprise1',
  'Announcer/BattleCallouts/Surprise2',
  'Announcer/BattleCallouts/Surprise3',
  'Announcer/BattleCallouts/Surprise4',
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
   * @summary Checks to see if a sound name exists in the sound library
   * @param {string} sfxName Name of sound effect
   * @returns {boolean} True if the sound exists in the sound library, false otherwise
   */
  public hasSound(sfxName: string): boolean {
    return has(this.lib, sfxName);
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
      // eslint-disable-next-line no-console
      console.error('Sound effect ', sfxName, ' not found!');
      return null;
    }

    sfxList.sort(this.SoundSort); // Sort so the oldest sound is on top, to reduce chance of interrupting sounds
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