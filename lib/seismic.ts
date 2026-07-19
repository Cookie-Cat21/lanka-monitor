/** Colombo — distance anchor for Sri Lanka reach. */
const COLOMBO = { lat: 6.9271, lon: 79.8612 };

/** USGS FDSN bbox: Indian Ocean basin west of Australia. */
export const INDIAN_OCEAN_BBOX = {
  minlatitude: -60,
  maxlatitude: 30,
  minlongitude: 20,
  maxlongitude: 100,
};

const USGS_QUERY =
  "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&eventtype=earthquake";

export interface SeismicEvent {
  id: string;
  magnitude: number;
  place: string;
  depth_km: number;
  observed_at: string;
  tsunami: boolean;
  url: string;
  distance_km: number;
}

export interface SeismicWatchData {
  status: "quiet" | "watch" | "error";
  alert: SeismicEvent | null;
  checked_at: string;
}

interface UsgsFeature {
  id: string;
  geometry: { coordinates: [number, number, number] };
  properties: {
    mag: number | null;
    place: string;
    time: number;
    url: string;
    tsunami: number;
  };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseEvent(f: UsgsFeature): SeismicEvent | null {
  const [lon, lat, depth] = f.geometry.coordinates;
  const mag = f.properties.mag;
  if (mag == null) return null;
  return {
    id: f.id,
    magnitude: mag,
    place: f.properties.place,
    depth_km: depth,
    observed_at: new Date(f.properties.time).toISOString(),
    tsunami: f.properties.tsunami === 1,
    url: f.properties.url,
    distance_km: Math.round(haversineKm(COLOMBO.lat, COLOMBO.lon, lat, lon)),
  };
}

/** Events that may warrant coastal attention for Sri Lanka. */
export function isWatchWorthy(event: SeismicEvent): boolean {
  if (event.tsunami) return true;
  if (event.magnitude >= 7) return true;
  if (event.magnitude >= 6.5 && event.depth_km <= 70 && event.distance_km <= 2000) {
    return true;
  }
  return false;
}

export async function getSeismicWatchData(): Promise<SeismicWatchData> {
  const checked_at = new Date().toISOString();
  const start = new Date(Date.now() - 72 * 3600 * 1000).toISOString().slice(0, 19);

  const params = new URLSearchParams({
    format: "geojson",
    eventtype: "earthquake",
    starttime: start,
    minmagnitude: "5.5",
    orderby: "time",
    limit: "50",
    ...Object.fromEntries(
      Object.entries(INDIAN_OCEAN_BBOX).map(([k, v]) => [k, String(v)])
    ),
  });

  try {
    const res = await fetch(`${USGS_QUERY}&${params}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return { status: "error", alert: null, checked_at };

    const body = (await res.json()) as { features?: UsgsFeature[] };
    const events = (body.features ?? [])
      .map(parseEvent)
      .filter((e): e is SeismicEvent => e !== null)
      .filter(isWatchWorthy)
      .sort((a, b) => b.magnitude - a.magnitude || a.distance_km - b.distance_km);

    const alert = events[0] ?? null;
    return { status: alert ? "watch" : "quiet", alert, checked_at };
  } catch {
    return { status: "error", alert: null, checked_at };
  }
}
