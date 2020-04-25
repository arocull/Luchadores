import _ from 'lodash';
import { EventEmitter } from 'events';

/* To test this go to Firefox's developer panel, under the Networking tab find
 * Throttling on the top right corner. Change it to something else, e.g. 'Wifi'.
 * This will slow down connections so you can watch the asset loading.
 */

class AssetPreloader extends EventEmitter {
  private loadedCount = 0;

  constructor(private resources: string[]) {
    super();
  }

  public addResource(source: string) {
    this.resources.push(source);
  }

  public preload() : Promise<void[]> {
    const loadQueue : Promise<void>[] = [];

    _.each(this.resources, (resource) => {
      loadQueue.push(this.loadImage(resource));
    });

    return Promise.all(loadQueue);
  }

  private loadImage(source : string) : Promise<void> {
    return new Promise((resolve) => {
      const image = new Image();

      image.onload = () => {
        this.loadedCount++;
        this.emit('progress', { progress: this.getProgress(), file: source });
        // TODO: Garbage collect these?
        resolve();
      };

      image.src = source;
    });
  }

  public getProgress() {
    return this.loadedCount / this.resources.length;
  }
}

export { AssetPreloader as default };
