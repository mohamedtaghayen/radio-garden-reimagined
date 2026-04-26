import { useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import type { Place } from "@/lib/radio-garden";
import { usePlayer } from "./use-radio-player";
import { Pause, Play, Plus, Minus, RotateCcw } from "lucide-react";

type PointDatum = {
  place: Place;
  lat: number;
  lng: number;
  size: number;
  active: boolean;
};

export function WorldGlobe({
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
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const current = usePlayer((s) => s.current);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotating, setRotating] = useState(true);

  // Limit for perf — most populous radio cities
  const points = useMemo<PointDatum[]>(() => {
    return [...places]
      .sort((a, b) => b.size - a.size)
      .slice(0, 1500)
      .map((p) => ({
        place: p,
        lat: p.geo[1],
        lng: p.geo[0],
        size: Math.min(0.8, 0.25 + Math.log10(p.size + 1) * 0.22),
        active: p.id === selectedPlaceId || current?.placeId === p.id,
      }));
  }, [places, selectedPlaceId, current?.placeId]);

  // Auto-rotate + initial camera
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const controls = g.controls() as unknown as {
      autoRotate: boolean;
      autoRotateSpeed: number;
      enableDamping: boolean;
      dampingFactor: number;
      minDistance: number;
      maxDistance: number;
      rotateSpeed: number;
      zoomSpeed: number;
    };
    controls.autoRotate = rotating;
    controls.autoRotateSpeed = 0.25;
    controls.enableDamping = true;
    controls.dampingFactor = 0.18;
    controls.minDistance = 150;
    controls.maxDistance = 700;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.2;
    g.pointOfView({ lat: 20, lng: 0, altitude: 2.4 }, 0);
  }, [rotating]);

  // Toggle autorotate without re-running camera reset
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const controls = g.controls() as unknown as { autoRotate: boolean };
    controls.autoRotate = rotating;
  }, [rotating]);

  // Fly to selected place
  useEffect(() => {
    if (!flyTo || !globeRef.current) return;
    const [lat, lng] = flyTo;
    globeRef.current.pointOfView({ lat, lng, altitude: 1.4 }, 1400);
  }, [flyTo]);

  // Track size for the globe canvas
  const sizeRef = useRef({ w: 800, h: 600 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      sizeRef.current = { w: el.clientWidth, h: el.clientHeight };
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const width = containerRef.current?.clientWidth ?? sizeRef.current.w;
  const height = containerRef.current?.clientHeight ?? sizeRef.current.h;

  const zoom = (factor: number) => {
    const g = globeRef.current;
    if (!g) return;
    const pov = g.pointOfView();
    g.pointOfView({ ...pov, altitude: Math.max(0.4, Math.min(4, (pov.altitude ?? 2) * factor)) }, 400);
  };
  const reset = () => {
    globeRef.current?.pointOfView({ lat: 20, lng: 0, altitude: 2.4 }, 800);
  };

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <Globe
        ref={globeRef}
        width={width}
        height={height}
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere
        atmosphereColor="#a9d6ff"
        atmosphereAltitude={0.2}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        pointsData={points}
        pointLat={(d: object) => (d as PointDatum).lat}
        pointLng={(d: object) => (d as PointDatum).lng}
        pointAltitude={(d: object) =>
          (d as PointDatum).active ? 0.08 : (d as PointDatum).size * 0.05
        }
        pointRadius={(d: object) =>
          (d as PointDatum).active ? 0.85 : 0.42
        }
        pointColor={(d: object) =>
          (d as PointDatum).active ? "#ef4444" : "#1e3a8a"
        }
        pointLabel={(d: object) => {
          const p = (d as PointDatum).place;
          return `<div style="background:white;color:#0f172a;padding:6px 10px;border-radius:8px;font-size:12px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,0.2)">${p.title}${p.country ? `<div style='font-size:10px;color:#64748b;font-weight:400'>${p.country}</div>` : ""}</div>`;
        }}
        pointResolution={8}
        pointsMerge={false}
        onPointClick={(d: object) => onSelectPlace((d as PointDatum).place)}
        onPointHover={(d: object | null) => {
          if (containerRef.current) {
            containerRef.current.style.cursor = d ? "pointer" : "grab";
          }
        }}
        ringsData={points.filter((p) => p.active)}
        ringLat={(d: object) => (d as PointDatum).lat}
        ringLng={(d: object) => (d as PointDatum).lng}
        ringColor={() => (t: number) => `rgba(239,68,68,${1 - t})`}
        ringMaxRadius={5}
        ringPropagationSpeed={2}
        ringRepeatPeriod={1200}
        onGlobeReady={() => {
          const g = globeRef.current;
          if (!g) return;
          const scene = g.scene();
          scene.add(new THREE.AmbientLight(0xffffff, 0.9));
          const dir = new THREE.DirectionalLight(0xffffff, 1.1);
          dir.position.set(1, 1, 1);
          scene.add(dir);
        }}
      />

      {/* Globe controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => setRotating((r) => !r)}
          title={rotating ? "Pause rotation" : "Resume rotation"}
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card/95 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground"
        >
          {rotating ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>
        <button
          onClick={() => zoom(0.7)}
          title="Zoom in"
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card/95 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={() => zoom(1.4)}
          title="Zoom out"
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card/95 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={reset}
          title="Reset view"
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card/95 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}