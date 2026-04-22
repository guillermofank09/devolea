import { Map, AdvancedMarker } from "@vis.gl/react-google-maps";

interface Props {
  lat: number;
  lng: number;
  height?: number | string;
  interactive?: boolean;
}

// mapId "DEMO_MAP_ID" is provided by Google for development.
// Create a real mapId at https://console.cloud.google.com/google/maps-apis/studio/maps
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID";

export default function GoogleMapView({ lat, lng, height = 200, interactive = false }: Props) {
  return (
    <Map
      mapId={MAP_ID}
      defaultCenter={{ lat, lng }}
      defaultZoom={15}
      gestureHandling={interactive ? "cooperative" : "none"}
      disableDefaultUI={!interactive}
      style={{ width: "100%", height }}
    >
      <AdvancedMarker position={{ lat, lng }} />
    </Map>
  );
}
