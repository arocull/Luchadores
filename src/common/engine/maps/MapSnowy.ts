import { MapPreset } from '../Enums';
import Map from './Map';

class MapSnowy extends Map {
  constructor() {
    super(MapPreset.Snowy);
  }
}

export { MapSnowy as default };