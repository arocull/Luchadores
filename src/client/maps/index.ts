import MapClient from './MapClient';
import MapClientSandy from './MapSandy';
import MapClientGrassy from './MapGrassy';
import MapClientSnowy from './MapSnowy';
import { MapPreset } from '../../common/engine/Enums';
import Map from '../../common/engine/maps/Map';

function mapFromID(id: MapPreset): Map {
  switch (id) {
    case MapPreset.Sandy:
      return new MapClientSandy();
    case MapPreset.Grassy:
      return new MapClientGrassy();
    case MapPreset.Snowy:
      return new MapClientSnowy();
    default:
    case MapPreset.None:
      throw new Error(`Client attempted to load a non-existent map type ${id}`);
  }
}

export {
  Map,
  MapClient,
  MapClientSandy,
  MapClientGrassy,
  MapClientSnowy,
  mapFromID,
};