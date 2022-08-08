import { MapPreset } from '../Enums';
import Map from './Map';

class MapSandy extends Map {
  constructor() {
    super(MapPreset.Sandy);
  }
}

export { MapSandy as default };