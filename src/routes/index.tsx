import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { fetchPlaces, type Place } from "@/lib/radio-garden";
import { PlayerBar } from "@/components/radio/player-bar";
import { SidePanel } from "@/components/radio/side-panel";
import { usePlayer } from "@/components/radio/use-radio-player";
import { Loader2 } from "lucide-react";

// Leaflet must only run in the browser
const WorldMap = lazy(() =>
  import("@/components/radio/world-map").then((m) => ({ default: m.WorldMap })),
);

export const Route = createFileRoute("/")({
  loader: async () => {
    const places = await fetchPlaces();
    return { places };
  },
  component: RadioGardenApp,
  head: () => ({
    meta: [
      { title: "Radio Garden — Listen to live radio from every corner of the world" },
      {
        name: "description",
        content:
          "Tune in to thousands of live radio stations across the globe. Spin the map, drop into a city, and hear what the world sounds like right now.",
      },
      { property: "og:title", content: "Radio Garden — Live radio from every corner of the world" },
      {
        property: "og:description",
        content: "Spin the map and tune into live radio from anywhere on Earth.",
      },
    ],
  }),
});

function RadioGardenApp() {
  const { places } = Route.useLoaderData();
  const init = usePlayer((s) => s.init);
  const [selected, setSelected] = useState<Place | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    init();
    setMounted(true);
  }, [init]);

  const handleSelect = (p: Place) => {
    setSelected(p);
    setFlyTo([p.geo[1], p.geo[0]]);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Glow background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_120%,oklch(0.45_0.31_268)_0%,oklch(0.22_0.28_268)_60%,oklch(0.18_0.2_268)_100%)]" />

      {/* Map */}
      <div className="absolute inset-0">
        {mounted ? (
          <Suspense fallback={<MapFallback />}>
            <WorldMap
              places={places}
              selectedPlaceId={selected?.id ?? null}
              onSelectPlace={handleSelect}
              flyTo={flyTo}
            />
          </Suspense>
        ) : (
          <MapFallback />
        )}
      </div>

      {/* Side panel */}
      <SidePanel
        places={places}
        selectedPlace={selected}
        onSelectPlace={handleSelect}
        onClearPlace={() => setSelected(null)}
      />

      {/* Bottom player */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] flex justify-center p-3 sm:p-4">
        <div className="pointer-events-auto w-full max-w-md">
          <PlayerBar />
        </div>
      </div>

      {/* Footer brand mark */}
      <div className="pointer-events-none absolute right-4 top-4 z-[999] hidden text-right sm:block">
        <div className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">
          Live Radio · Worldwide
        </div>
      </div>
    </div>
  );
}

function MapFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading the world…
      </div>
    </div>
  );
}
