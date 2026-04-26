import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { fetchPlaces, type Place } from "@/lib/radio-garden";
import { PlayerBar } from "@/components/radio/player-bar";
import { SidePanel } from "@/components/radio/side-panel";
import { usePlayer } from "@/components/radio/use-radio-player";
import { Loader2 } from "lucide-react";

// Three.js must only run in the browser
const WorldGlobe = lazy(() =>
  import("@/components/radio/world-globe").then((m) => ({
    default: m.WorldGlobe,
  })),
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
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  useEffect(() => {
    init();
    setMounted(true);
  }, [init]);

  const handleSelect = (p: Place) => {
    setSelected(p);
    setFlyTo([p.geo[1], p.geo[0]]);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Side panel — fixed, never overlaps the globe */}
      <SidePanel
        places={places}
        selectedPlace={selected}
        onSelectPlace={handleSelect}
        onClearPlace={() => setSelected(null)}
        collapsed={panelCollapsed}
        onToggleCollapsed={() => setPanelCollapsed((c) => !c)}
      />

      {/* Globe area */}
      <div className="relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_50%_30%,oklch(0.97_0.04_230)_0%,oklch(0.88_0.08_230)_60%,oklch(0.75_0.14_240)_100%)]">
        {mounted ? (
          <Suspense fallback={<MapFallback />}>
            <WorldGlobe
              places={places}
              selectedPlaceId={selected?.id ?? null}
              onSelectPlace={handleSelect}
              flyTo={flyTo}
            />
          </Suspense>
        ) : (
          <MapFallback />
        )}

        {/* Brand mark */}
        <div className="pointer-events-none absolute right-4 top-4 hidden text-right sm:block">
          <div className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">
            Live Radio · Worldwide
          </div>
        </div>

        {/* Bottom player */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3 sm:p-4">
          <div className="pointer-events-auto w-full max-w-md">
            <PlayerBar />
          </div>
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
