import { rest } from "./db";
import type { AqiCategory, AqiData, Observation, SourceStatus } from "./types";

/** US EPA AQI breakpoints for PM2.5 (µg/m³). */
const PM25_BREAKS: [number, number, number, number][] = [
  [0, 12.0, 0, 50],
  [12.1, 35.4, 51, 100],
  [35.5, 55.4, 101, 150],
  [55.5, 150.4, 151, 200],
  [150.5, 250.4, 201, 300],
  [250.5, 500.4, 301, 500],
];

export const AQI_SCALE: Record<
  AqiCategory,
  { label: string; accent: string; tint: string; text: string }
> = {
  good: {
    label: "Good",
    accent: "#56b4e9",
    tint: "rgba(86,180,233,0.14)",
    text: "#9cd4f0",
  },
  moderate: {
    label: "Moderate",
    accent: "#f0e442",
    tint: "rgba(240,228,66,0.12)",
    text: "#f5ef8a",
  },
  sensitive: {
    label: "Sensitive",
    accent: "#e69f00",
    tint: "rgba(230,159,0,0.14)",
    text: "#f0c066",
  },
  unhealthy: {
    label: "Unhealthy",
    accent: "#d55e00",
    tint: "rgba(213,94,0,0.14)",
    text: "#e89766",
  },
  very_unhealthy: {
    label: "Very bad",
    accent: "#cc79a7",
    tint: "rgba(204,121,167,0.14)",
    text: "#dfa8c8",
  },
  hazardous: {
    label: "Hazardous",
    accent: "#bbbbbb",
    tint: "rgba(187,187,187,0.12)",
    text: "#d6d6d6",
  },
};

export function pm25ToAqi(pm25: number): number {
  for (const [cLow, cHigh, iLow, iHigh] of PM25_BREAKS) {
    if (pm25 <= cHigh) {
      return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (pm25 - cLow) + iLow);
    }
  }
  return 500;
}

export function aqiCategory(aqi: number): AqiCategory {
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "sensitive";
  if (aqi <= 200) return "unhealthy";
  if (aqi <= 300) return "very_unhealthy";
  return "hazardous";
}

export async function getSourceStatuses(): Promise<SourceStatus[] | null> {
  return rest<SourceStatus[]>("source_status?select=*&order=id.asc", 120);
}

export async function getAqiData(): Promise<AqiData> {
  const rows = await rest<Observation[]>(
    "observations?source_id=eq.openaq_colombo&metric=in.(pm25_ugm3,aqi)" +
      "&order=observed_at.desc&limit=4&select=metric,value,unit,observed_at,meta",
    300
  );
  if (!rows || rows.length === 0) {
    return { latest: null, location: null };
  }

  let pm25: number | null = null;
  let aqi: number | null = null;
  let observedAt = rows[0].observed_at;
  let location: string | null = null;

  for (const row of rows) {
    if (row.metric === "pm25_ugm3" && pm25 === null) {
      pm25 = Number(row.value);
      observedAt = row.observed_at;
      location =
        typeof row.meta?.location === "string" ? row.meta.location : null;
    }
    if (row.metric === "aqi" && aqi === null) {
      aqi = Number(row.value);
    }
  }

  if (pm25 === null) return { latest: null, location };

  const resolvedAqi = aqi ?? pm25ToAqi(pm25);
  return {
    latest: {
      aqi: resolvedAqi,
      pm25,
      category: aqiCategory(resolvedAqi),
      observed_at: observedAt,
    },
    location,
  };
}
