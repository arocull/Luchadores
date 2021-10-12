import { MapPreset } from '../Enums';
import Map from './Map';

class MapSnowy extends Map {
  constructor() {
    super(MapPreset.Snowy, 40, 40);
  }
}

export { MapSnowy as default };