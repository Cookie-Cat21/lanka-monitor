"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Layers, X } from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { SeismicWatchData } from "@/lib/types";

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

/** Sri Lanka centre + default zoom */
const SL_CENTER: [number, number] = [80.77, 7.87];
const SL_ZOOM = 6.8;

interface WeatherPoint {
  lat: number;
  lon: number;
  label: string;
  temp_c: number;
  condition: string;
}

interface PowerOutage {
  lat: number;
  lon: number;
  area: string;
  count: number;
}

interface Props {
  seismic?: SeismicWatchData | null;
  weatherPoints?: WeatherPoint[];
  powerOutages?: PowerOutage[];
}

type LayerId = "weather" | "power" | "quakes";

const LAYER_LABELS: Record<LayerId, string> = {
  weather: "Weather stations",
  power: "Power outages",
  quakes: "Nearby quakes",
};

function pointsToGeoJson<T extends { lat: number; lon: number }>(points: T[]) {
  return {
    type: "FeatureCollection" as const,
    features: points.map((p) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [p.lon, p.lat] as [number, number] },
      properties: p as unknown as Record<string, unknown>,
    })),
  };
}

export default function SituationMap({ seismic, weatherPoints = [], powerOutages = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [layers, setLayers] = useState<Record<LayerId, boolean>>({
    weather: true,
    power: true,
    quakes: true,
  });
  const [panelOpen, setPanelOpen] = useState(false);

  const toggleLayer = useCallback((id: LayerId, visible: boolean) => {
    setLayers((prev) => ({ ...prev, [id]: visible }));
    const map = mapRef.current;
    if (!map) return;
    const v = visible ? "visible" : "none";
    if (map.getLayer(`${id}-layer`)) {
      map.setLayoutProperty(`${id}-layer`, "visibility", v);
    }
    if (map.getLayer(`${id}-labels`)) {
      map.setLayoutProperty(`${id}-labels`, "visibility", v);
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const map = new maplibregl.Map({
      container: el,
      style: MAP_STYLE,
      center: SL_CENTER,
      zoom: SL_ZOOM,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      dragRotate: false,
      touchPitch: false,
      maxPitch: 0,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      // ── Weather layer ────────────────────────────────────────────────────────
      const weatherFeatures = weatherPoints.length > 0
        ? pointsToGeoJson(weatherPoints)
        : pointsToGeoJson([
            { lat: 6.9271, lon: 79.8612, label: "Colombo", temp_c: 0, condition: "—" },
          ]);

      map.addSource("weather-src", { type: "geojson", data: weatherFeatures });
      map.addLayer({
        id: "weather-layer",
        type: "circle",
        source: "weather-src",
        paint: {
          "circle-radius": 6,
          "circle-color": "#56b4e9",
          "circle-opacity": 0.8,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#0b1016",
        },
        layout: { visibility: "visible" },
      });

      // ── Power outage layer ───────────────────────────────────────────────────
      const powerFeatures =
        powerOutages.length > 0
          ? pointsToGeoJson(powerOutages)
          : { type: "FeatureCollection" as const, features: [] };

      map.addSource("power-src", { type: "geojson", data: powerFeatures });
      map.addLayer({
        id: "power-layer",
        type: "circle",
        source: "power-src",
        paint: {
          "circle-radius": 8,
          "circle-color": "#fbbf24",
          "circle-opacity": 0.75,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#0b1016",
        },
        layout: { visibility: "visible" },
      });

      // ── Quake layer ──────────────────────────────────────────────────────────
      const quakeFeatures = {
        type: "FeatureCollection" as const,
        features: [] as maplibregl.GeoJSONFeature[],
      };
      if (seismic?.alert) {
        // We don't have exact coords for the alert from our data model,
        // so skip plotting unless coords are attached in future extension.
        void seismic;
      }

      map.addSource("quakes-src", { type: "geojson", data: quakeFeatures });
      map.addLayer({
        id: "quakes-layer",
        type: "circle",
        source: "quakes-src",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "magnitude"],
            5.5, 8,
            7, 18,
            9, 30,
          ],
          "circle-color": "#f87171",
          "circle-opacity": 0.6,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#0b1016",
        },
        layout: { visibility: "visible" },
      });
    });

    const onResize = () => map.resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-panel-edge bg-panel"
      aria-label="Sri Lanka situation map"
    >
      <div
        ref={containerRef}
        className="h-[min(52vh,380px)] w-full sm:h-[min(48vh,420px)]"
      />

      {/* Top-left label */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
        <div>
          <h2 className="text-sm font-medium text-ink">Situation map</h2>
          <p className="text-xs text-muted">Sri Lanka · live layers</p>
        </div>
      </div>

      {/* Layer FAB */}
      <button
        onClick={() => setPanelOpen((p) => !p)}
        aria-label="Toggle map layers"
        aria-expanded={panelOpen}
        className="absolute bottom-10 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-panel-edge bg-panel shadow-lg hover:bg-lagoon-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:bottom-10 sm:right-4"
      >
        <Layers className="h-4 w-4 text-ink-soft" />
      </button>

      {/* Layer bottom sheet */}
      {panelOpen && (
        <div className="absolute bottom-0 left-0 right-0 z-20 rounded-t-2xl border-t border-panel-edge bg-panel/95 p-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-ink-soft">Map layers</h3>
            <button
              onClick={() => setPanelOpen(false)}
              aria-label="Close layers panel"
              className="rounded p-0.5 text-muted hover:text-ink-soft focus-visible:outline focus-visible:outline-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="space-y-3">
            {(["weather", "power", "quakes"] as LayerId[]).map((id) => (
              <li key={id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded-full ${
                      id === "weather"
                        ? "bg-[#56b4e9]"
                        : id === "power"
                          ? "bg-stale"
                          : "bg-down"
                    }`}
                    aria-hidden
                  />
                  <label
                    htmlFor={`layer-${id}`}
                    className="cursor-pointer text-sm text-ink-soft"
                  >
                    {LAYER_LABELS[id]}
                  </label>
                </div>
                <input
                  id={`layer-${id}`}
                  type="checkbox"
                  checked={layers[id]}
                  onChange={(e) => toggleLayer(id, e.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-fresh"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
