/** Demo AIS positions around Colombo port — replaced by ingest when live. */

export interface AisVessel {
  mmsi: string;
  name: string;
  lon: number;
  lat: number;
  sog: number; // knots
}

const PORT = { lon: 79.845, lat: 6.938 };

const QUIET_THRESHOLD = 12;

/** Deterministic pseudo-random from a seed. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hour-of-day drives traffic: busy 08–18 Colombo, quiet overnight. */
export function colomboHour(): number {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    hour: "numeric",
    hour12: false,
  });
  return Number(fmt.format(new Date()));
}

export function isQuietHour(hour = colomboHour()): boolean {
  return hour < 6 || hour >= 20;
}

export function demoVessels(now = Date.now()): AisVessel[] {
  const hour = colomboHour();
  const quiet = isQuietHour(hour);
  const count = quiet ? 4 + (hour % 4) : 18 + (hour % 14);
  const rand = mulberry32(Math.floor(now / 60_000));

  const vessels: AisVessel[] = [];
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = 0.004 + rand() * (quiet ? 0.012 : 0.022);
    vessels.push({
      mmsi: `417${String(100000 + i).slice(-6)}`,
      name: `LK-${String(i + 1).padStart(2, "0")}`,
      lon: PORT.lon + Math.cos(angle) * radius,
      lat: PORT.lat + Math.sin(angle) * radius * 0.7,
      sog: quiet ? rand() * 0.8 : rand() * 8,
    });
  }
  return vessels;
}

export function vesselsToGeoJson(vessels: AisVessel[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: vessels.map((v) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [v.lon, v.lat] },
      properties: { mmsi: v.mmsi, name: v.name, sog: v.sog },
    })),
  };
}

export function isPortQuiet(vessels: AisVessel[]): boolean {
  const moving = vessels.filter((v) => v.sog > 0.5).length;
  return vessels.length < QUIET_THRESHOLD || moving < 3;
}

export { PORT as COLOMBO_PORT, QUIET_THRESHOLD };
