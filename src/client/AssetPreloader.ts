import { EventEmitter } from 'events';

/* To test this go to Firefox's developer panel, under the Networking tab find
 * Throttling on the top right corner. Change it to something else, e.g. 'Wifi'.
 * This will slow down connections so you can watch the asset loading.
 */

class AssetPreloaderImpl extends EventEmitter {
  private loadedCount = 0;
  private preloads: Record<string, Promise<HTMLImageElement>>;

  constructor(resources: string[]) {
    super();

    this.preloads = resources.reduce((acc, src) => {
      acc[src] = this.loadImage(src);
      return acc;
    }, {} as Record<string, Promise<HTMLImageElement>>);
  }

  // /**
  //  * @deprecated unnecessary. Use `getImages`
  //  */
  // public preload() : Promise<HTMLImageElement[]> {
  //   return Promise.all(Object.values(this.preloads));
  // }

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

  public getImages(imgSrc: string[]): Promise<HTMLImageElement[]> {
    const promises = imgSrc.map((src) => this.getImage(src));
    return Promise.all(promises);
  }

  public getImage(imgSrc: string): Promise<HTMLImageElement> {
    let promise = this.preloads[imgSrc];
    if (!promise) {
      promise = this.loadImage(imgSrc);
      this.preloads[imgSrc] = promise;
    }
    return promise;
  }

  public getProgress() {
    return this.loadedCount / Object.keys(this.preloads).length;
  }
}

// Singleton
const AssetPreloader = new AssetPreloaderImpl([]);

export { AssetPreloader as default };
