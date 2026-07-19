import { rest } from "./db";
import type { Observation, SourceStatus, WeatherData } from "./types";

/** WMO weather interpretation codes → human label. */
const WMO_LABELS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Icy fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Light rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Moderate snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Moderate showers",
  82: "Violent showers",
  95: "Thunderstorm",
  96: "Thunderstorm w/ hail",
  99: "Severe thunderstorm",
};

function wmoLabel(code: number): string {
  return WMO_LABELS[code] ?? `Code ${code}`;
}

interface OpenMeteoResponse {
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  hourly?: {
    time: string[];
    precipitation_probability: (number | null)[];
  };
}

const COLOMBO_LAT = 6.9271;
const COLOMBO_LON = 79.8612;

const METRICS = [
  "weather_temp_c",
  "weather_humidity_pct",
  "weather_precip_mm",
  "weather_wind_kmh",
  "weather_code",
  "weather_precip_prob_pct",
] as const;

/** Prefer ingested observations; fall back to Open-Meteo (server-cached). */
export async function getWeatherData(): Promise<WeatherData> {
  const fromDb = await fromObservations();
  if (fromDb.current) return fromDb;
  return fromOpenMeteo();
}

export async function getWeatherSourceStatus(): Promise<SourceStatus | null> {
  const statuses = await rest<SourceStatus[]>(
    "source_status?select=*&id=eq.open_meteo",
    120,
  );
  return statuses?.[0] ?? null;
}

async function fromObservations(): Promise<WeatherData> {
  const since = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
  const rows = await rest<Observation[]>(
    `observations?source_id=eq.open_meteo&metric=in.(${METRICS.join(",")})` +
      `&observed_at=gte.${since}&order=observed_at.desc&select=metric,value,observed_at`,
    300,
  );
  if (!rows || rows.length === 0) {
    return { current: null, precip_pct_next6h: null, location: "Colombo" };
  }

  const latestByMetric = new Map<string, Observation>();
  for (const row of rows) {
    if (!latestByMetric.has(row.metric)) latestByMetric.set(row.metric, row);
  }

  const temp = latestByMetric.get("weather_temp_c");
  if (!temp) {
    return { current: null, precip_pct_next6h: null, location: "Colombo" };
  }

  const code = Number(latestByMetric.get("weather_code")?.value ?? 0);
  const precipProb = latestByMetric.get("weather_precip_prob_pct");

  return {
    current: {
      temp_c: Number(temp.value),
      rain_mm: Number(latestByMetric.get("weather_precip_mm")?.value ?? 0),
      wind_kmh: Number(latestByMetric.get("weather_wind_kmh")?.value ?? 0),
      humidity_pct: Number(latestByMetric.get("weather_humidity_pct")?.value ?? 0),
      weather_code: code,
      weather_label: wmoLabel(code),
      observed_at: temp.observed_at,
    },
    precip_pct_next6h: precipProb != null ? Number(precipProb.value) : null,
    location: "Colombo",
  };
}

async function fromOpenMeteo(): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(COLOMBO_LAT),
    longitude: String(COLOMBO_LON),
    current:
      "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
    hourly: "precipitation_probability",
    timezone: "Asia/Colombo",
    forecast_days: "1",
  });

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      { next: { revalidate: 1800 } },
    );
    if (!res.ok) {
      return { current: null, precip_pct_next6h: null, location: "Colombo" };
    }

    const body = (await res.json()) as OpenMeteoResponse;
    const c = body.current;
    if (!c) {
      return { current: null, precip_pct_next6h: null, location: "Colombo" };
    }

    let precip_pct_next6h: number | null = null;
    if (body.hourly) {
      const now = new Date();
      const probs = body.hourly.precipitation_probability;
      const times = body.hourly.time;
      const next6: number[] = [];
      for (let i = 0; i < times.length; i++) {
        const t = new Date(times[i]);
        const diffH = (t.getTime() - now.getTime()) / 3_600_000;
        if (diffH >= 0 && diffH <= 6 && probs[i] != null) {
          next6.push(probs[i] as number);
        }
      }
      if (next6.length > 0) precip_pct_next6h = Math.max(...next6);
    }

    return {
      current: {
        temp_c: c.temperature_2m,
        rain_mm: c.precipitation,
        wind_kmh: c.wind_speed_10m,
        humidity_pct: c.relative_humidity_2m,
        weather_code: c.weather_code,
        weather_label: wmoLabel(c.weather_code),
        observed_at: new Date(c.time).toISOString(),
      },
      precip_pct_next6h,
      location: "Colombo",
    };
  } catch {
    return { current: null, precip_pct_next6h: null, location: "Colombo" };
  }
}
