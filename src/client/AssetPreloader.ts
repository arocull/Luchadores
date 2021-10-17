import { EventEmitter } from 'events';

/* To test this go to Firefox's developer panel, under the Networking tab find
 * Throttling on the top right corner. Change it to something else, e.g. 'Wifi'.
 * This will slow down connections so you can watch the asset loading.
 */

class AssetPreloaderImpl extends EventEmitter {
  private loadedCount = 0;
  private imageQueue: Record<string, Promise<HTMLImageElement>>;
  private audioQueue: Record<string, Promise<HTMLAudioElement>>;

  constructor(resources: string[], audioSources: string[]) {
    super();

    this.imageQueue = resources.reduce((acc, src) => {
      acc[src] = this.loadImage(src);
      return acc;
    }, {} as Record<string, Promise<HTMLImageElement>>);

    this.audioQueue = audioSources.reduce((acc, src) => {
      acc[src] = this.loadAudio(src);
      return acc;
    }, {} as Record<string, Promise<HTMLAudioElement>>);
  }

  private loadImage(source : string) : Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve) => {
      const image = new Image();

      image.onload = () => {
        this.loadedCount++;
        this.emit('progress', { progress: this.getProgress(), file: source });
        // TODO: Garbage collect these?
        resolve(image);
      };

      image.src = source;
    });
  }

  private loadAudio(source : string) : Promise<HTMLAudioElement> {
    return new Promise<HTMLAudioElement>((resolve) => {
      const audio = new Audio(source);

      // CanPlayThrough event indicates that enough of the audio is downloaded
      // that it can play without any suspected interruptions
      audio.addEventListener('canplaythrough', () => {
        this.loadedCount++;
        this.emit('progress', { progress: this.getProgress(), file: source });
        // TODO: Garbage collect these?
        resolve(audio);
      });

      audio.src = source;
    });
  }

  public getImages(imgSrc: string[]): Promise<HTMLImageElement[]> {
    const promises = imgSrc.map((src) => this.getImage(src));
    return Promise.all(promises);
  }

  public getImageQueue(): Promise<HTMLImageElement>[] {
    // Return a copy of the current queue
    return Object.values(this.imageQueue).slice();
  }

  public getAudioList(audioSrc: string[]): Promise<HTMLAudioElement[]> {
    const promises = audioSrc.map((src) => this.getAudio(src));
    return Promise.all(promises);
  }

  public getImage(imgSrc: string): Promise<HTMLImageElement> {
    let promise = this.imageQueue[imgSrc];
    if (!promise) {
      promise = this.loadImage(imgSrc);
      this.imageQueue[imgSrc] = promise;
    }
    return promise;
  }

  public getAudio(audioSrc: string): Promise<HTMLAudioElement> {
    let promise = this.audioQueue[audioSrc];
    if (!promise) {
      promise = this.loadAudio(audioSrc);
      this.audioQueue[audioSrc] = promise;
    }
    return promise;
  }

  public getAudioQueue(): Promise<HTMLAudioElement>[] {
    // Return a copy of the current queue
    return Object.values(this.audioQueue).slice();
  }

  public getProgress() {
    return this.loadedCount / (Object.keys(this.imageQueue).length + Object.keys(this.audioQueue).length);
  }
}

// Singleton
const AssetPreloader = new AssetPreloaderImpl([], []);

export { AssetPreloader as default };
