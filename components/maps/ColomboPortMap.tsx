"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  COLOMBO_PORT,
  demoVessels,
  isPortQuiet,
  vesselsToGeoJson,
} from "@/lib/ais-colombo";

const STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const SOURCE_ID = "ais-ships";

function mobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 640px)").matches;
}

function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function ColomboPortMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [quiet, setQuiet] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const mobile = mobileViewport();
    const map = new maplibregl.Map({
      container: el,
      style: STYLE,
      center: [COLOMBO_PORT.lon, COLOMBO_PORT.lat],
      zoom: mobile ? 11.2 : 11.8,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      pixelRatio: mobile ? Math.min(window.devicePixelRatio, 1.5) : undefined,
      dragRotate: false,
      touchPitch: false,
      maxPitch: 0,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );

    map.on("load", () => {
      const vessels = demoVessels();
      setCount(vessels.length);
      setQuiet(isPortQuiet(vessels));

      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: vesselsToGeoJson(vessels),
      });

      map.addLayer({
        id: "ships-heat",
        type: "heatmap",
        source: SOURCE_ID,
        maxzoom: 14,
        paint: {
          "heatmap-weight": 1,
          "heatmap-intensity": mobile ? 0.55 : 0.85,
          "heatmap-radius": mobile ? 14 : 22,
          "heatmap-opacity": 0.72,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(17, 24, 35, 0)",
            0.15,
            "rgba(52, 211, 153, 0.25)",
            0.45,
            "rgba(52, 211, 153, 0.55)",
            0.75,
            "rgba(251, 191, 36, 0.75)",
            1,
            "rgba(248, 113, 113, 0.9)",
          ],
        },
      });

      map.addLayer({
        id: "ships-dots",
        type: "circle",
        source: SOURCE_ID,
        minzoom: 12,
        paint: {
          "circle-radius": mobile ? 2 : 3,
          "circle-color": "#34d399",
          "circle-opacity": 0.85,
          "circle-stroke-width": 0.5,
          "circle-stroke-color": "#0b1016",
        },
      });
    });

    const refreshMs = () => {
      const q = isPortQuiet(demoVessels());
      if (reducedMotion()) return 120_000;
      if (mobile) return q ? 90_000 : 45_000;
      return q ? 60_000 : 20_000;
    };

    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const vessels = demoVessels();
      const q = isPortQuiet(vessels);
      setCount(vessels.length);
      setQuiet(q);

      const src = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (src) src.setData(vesselsToGeoJson(vessels));

      if (map.getLayer("ships-heat")) {
        map.setPaintProperty("ships-heat", "heatmap-intensity", q ? 0.35 : mobile ? 0.65 : 0.9);
        map.setPaintProperty("ships-heat", "heatmap-opacity", q ? 0.45 : 0.72);
      }

      timer = setTimeout(tick, refreshMs());
    };

    map.once("load", () => {
      timer = setTimeout(tick, refreshMs());
    });

    const onResize = () => map.resize();
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      map.remove();
    };
  }, []);

  return (
    <section
      className="relative overflow-hidden rounded-xl border border-panel-edge bg-panel"
      aria-label="Colombo port vessel traffic"
    >
      <div ref={containerRef} className="h-[min(42vh,320px)] w-full sm:h-[min(38vh,360px)]" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
        <div>
          <h2 className="text-sm font-medium text-zinc-200">Colombo port</h2>
          <p className="text-xs text-text-dim">AIS vessel density · demo data</p>
        </div>

        <div
          className={`tabular rounded-lg border border-panel-edge bg-ink/80 px-2.5 py-1.5 text-right backdrop-blur-sm ${
            quiet && !reducedMotion() ? "animate-[pulse_4s_ease-in-out_infinite]" : ""
          }`}
        >
          <div className="text-lg font-semibold leading-none text-zinc-100">{count}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wide text-text-dim">
            {quiet ? "quiet" : "active"}
          </div>
        </div>
      </div>
    </section>
  );
}
