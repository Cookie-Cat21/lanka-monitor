import { rest } from "./db";
import type { FuelData, FuelSeriesPoint, Observation, SourceStatus } from "./types";

const SOURCE_ID = "fuel_prices";

const METRICS = ["fuel_petrol_92", "fuel_petrol_95", "fuel_diesel", "fuel_kerosene"] as const;
type FuelMetric = (typeof METRICS)[number];

const METRIC_KEY: Record<FuelMetric, keyof FuelSeriesPoint> = {
  fuel_petrol_92: "petrol_92",
  fuel_petrol_95: "petrol_95",
  fuel_diesel: "diesel",
  fuel_kerosene: "kerosene",
};

export async function getFuelSourceStatus(): Promise<SourceStatus | null> {
  const rows = await rest<SourceStatus[]>(
    `source_status?select=*&id=eq.${SOURCE_ID}`,
    120
  );
  return rows?.[0] ?? null;
}

export async function getFuelData(): Promise<FuelData> {
  const since = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
  const rows = await rest<Observation[]>(
    `observations?source_id=eq.${SOURCE_ID}` +
      `&metric=in.(${METRICS.join(",")})` +
      `&observed_at=gte.${since}&order=observed_at.asc&select=metric,value,unit,observed_at`,
    300
  );

  if (!rows || rows.length === 0) return { latest: null, series: [] };

  const byDate = new Map<string, FuelSeriesPoint>();
  let latestAt = "";

  for (const row of rows) {
    const date = row.observed_at.slice(0, 10);
    const point: FuelSeriesPoint = byDate.get(date) ?? {
      date,
      petrol_92: null,
      petrol_95: null,
      diesel: null,
      kerosene: null,
    };
    const key = METRIC_KEY[row.metric as FuelMetric];
    if (key) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (point as any)[key] = Number(row.value);
    }
    byDate.set(date, point);
    if (row.observed_at > latestAt) latestAt = row.observed_at;
  }

  const series = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  const last = series[series.length - 1];

  if (!last) return { latest: null, series };

  return {
    latest: {
      petrol_92: last.petrol_92,
      petrol_95: last.petrol_95,
      diesel: last.diesel,
      kerosene: last.kerosene,
      observed_at: latestAt || last.date,
    },
    series,
  };
}
