import { useEffect, useMemo, useRef } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import type { Place } from "@/lib/radio-garden";
import { usePlayer } from "./use-radio-player";

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

  // Limit for perf — most populous radio cities
  const points = useMemo<PointDatum[]>(() => {
    return [...places]
      .sort((a, b) => b.size - a.size)
      .slice(0, 1500)
      .map((p) => ({
        place: p,
        lat: p.geo[1],
        lng: p.geo[0],
        size: Math.min(0.6, 0.15 + Math.log10(p.size + 1) * 0.18),
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
    };
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 180;
    controls.maxDistance = 600;
    g.pointOfView({ lat: 20, lng: 0, altitude: 2.4 }, 0);
  }, []);

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

  return (
    <div ref={containerRef} className="absolute inset-0">
      <Globe
        ref={globeRef}
        width={width}
        height={height}
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere
        atmosphereColor="#7dffb0"
        atmosphereAltitude={0.22}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        pointsData={points}
        pointLat={(d: object) => (d as PointDatum).lat}
        pointLng={(d: object) => (d as PointDatum).lng}
        pointAltitude={(d: object) =>
          (d as PointDatum).active ? 0.06 : (d as PointDatum).size * 0.04
        }
        pointRadius={(d: object) =>
          (d as PointDatum).active ? 0.55 : 0.22
        }
        pointColor={(d: object) =>
          (d as PointDatum).active ? "#7dffb0" : "rgba(255,255,255,0.85)"
        }
        pointResolution={6}
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
        ringColor={() => (t: number) => `rgba(125,255,176,${1 - t})`}
        ringMaxRadius={4}
        ringPropagationSpeed={2}
        ringRepeatPeriod={1200}
        onGlobeReady={() => {
          const g = globeRef.current;
          if (!g) return;
          // Subtle ambient tint
          const scene = g.scene();
          scene.add(new THREE.AmbientLight(0x88aaff, 0.4));
          const dir = new THREE.DirectionalLight(0xffffff, 0.8);
          dir.position.set(1, 1, 1);
          scene.add(dir);
        }}
      />
    </div>
  );
}