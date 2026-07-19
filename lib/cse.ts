import { rest } from "./db";
import type { CseData, CseIndex, Observation, SourceStatus } from "./types";

const METRICS = ["cse_aspi", "cse_sl20"] as const;

function buildIndex(
  rows: Observation[],
  metric: (typeof METRICS)[number]
): CseIndex {
  const filtered = rows.filter((r) => r.metric === metric);
  if (filtered.length === 0) return { latest: null, series: [] };

  const byDate = new Map<string, number>();
  for (const row of filtered) {
    byDate.set(row.observed_at.slice(0, 10), Number(row.value));
  }
  const series = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));

  const last = series[series.length - 1];
  const lastObserved = filtered[filtered.length - 1].observed_at;
  return {
    latest: last ? { value: last.value, observed_at: lastObserved } : null,
    series,
  };
}

export async function getCseData(): Promise<CseData> {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const rows = await rest<Observation[]>(
    `observations?source_id=eq.cse_asi&metric=in.(${METRICS.join(",")})` +
      `&observed_at=gte.${since}&order=observed_at.asc&select=metric,value,observed_at`,
    300
  );
  if (!rows || rows.length === 0) {
    return { aspi: { latest: null, series: [] }, sl20: { latest: null, series: [] } };
  }

  return {
    aspi: buildIndex(rows, "cse_aspi"),
    sl20: buildIndex(rows, "cse_sl20"),
  };
}

export async function getCseSourceStatus(): Promise<SourceStatus | null> {
  const statuses = await rest<SourceStatus[]>(
    "source_status?select=*&id=eq.cse_asi",
    120
  );
  return statuses?.[0] ?? null;
}

export function indexDelta(series: { value: number | null }[]): number | null {
  const values = series.map((p) => p.value).filter((v): v is number => v !== null);
  if (values.length < 2) return null;
  return values[values.length - 1] - values[values.length - 2];
}
