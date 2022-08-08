import { MapPreset } from '../Enums';
import Map from './Map';

class MapGrassy extends Map {
  constructor() {
    super(MapPreset.Grassy);
  }
}

export { MapGrassy as default };