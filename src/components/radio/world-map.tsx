import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import type { Place } from "@/lib/radio-garden";
import { usePlayer } from "./use-radio-player";

function makeIcon(active: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="station-marker${active ? " active" : ""}"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

function FlyTo({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.flyTo(center, Math.max(map.getZoom(), 5), { duration: 1.2 });
  }, [center, map]);
  return null;
}

export function WorldMap({
  places,
  onSelectPlace,
  selectedPlaceId,
  flyTo,
}: {
  places: Place[];
  onSelectPlace: (place: Place) => void;
  selectedPlaceId: string | null;
  flyTo: [number, number] | null;
}) {
  const current = usePlayer((s) => s.current);
  // Limit markers for perf — show top N by station count
  const visible = useMemo(
    () => [...places].sort((a, b) => b.size - a.size).slice(0, 1500),
    [places],
  );

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      maxZoom={8}
      worldCopyJump
      zoomControl={false}
      style={{ width: "100%", height: "100%" }}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png"
        attribution=""
      />
      <FlyTo center={flyTo} />
      {visible.map((place) => {
        const active =
          place.id === selectedPlaceId || current?.placeId === place.id;
        return (
          <Marker
            key={place.id}
            position={[place.geo[1], place.geo[0]]}
            icon={makeIcon(active)}
            eventHandlers={{
              click: () => onSelectPlace(place),
            }}
          />
        );
      })}
    </MapContainer>
  );
}