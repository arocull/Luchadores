import { MapPreset } from '../Enums';
import Map from './Map';

class MapGrassy extends Map {
  constructor() {
    super(MapPreset.Grassy, 40, 40);
  }
}

export { MapGrassy as default };