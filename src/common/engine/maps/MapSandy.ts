import { MapPreset } from '../Enums';
import Map from './Map';

class MapSandy extends Map {
  constructor() {
    super(MapPreset.Sandy, 40, 40);
  }
}

export { MapSandy as default };