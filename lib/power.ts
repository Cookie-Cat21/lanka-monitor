import { rest } from "./db";
import type { Observation, PowerData, PowerDayCount, SourceStatus } from "./types";

const SOURCE_ID = "ceb_power";
const METRIC = "power_active_outages";

export async function getPowerSourceStatus(): Promise<SourceStatus | null> {
  const rows = await rest<SourceStatus[]>(
    `source_status?select=*&id=eq.${SOURCE_ID}`,
    120
  );
  return rows?.[0] ?? null;
}

export async function getPowerData(): Promise<PowerData> {
  const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
  const rows = await rest<Observation[]>(
    `observations?source_id=eq.${SOURCE_ID}&metric=eq.${METRIC}` +
      `&observed_at=gte.${since}&order=observed_at.asc&select=value,observed_at`,
    120
  );

  if (!rows || rows.length === 0) {
    return { active_outages: null, series: [], observed_at: null };
  }

  // Group by date — take max value per day (most pessimistic count)
  const byDate = new Map<string, number>();
  for (const row of rows) {
    const date = row.observed_at.slice(0, 10);
    const v = Number(row.value);
    byDate.set(date, Math.max(byDate.get(date) ?? 0, v));
  }

  const series: PowerDayCount[] = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const last = rows[rows.length - 1];
  return {
    active_outages: series[series.length - 1]?.count ?? null,
    series,
    observed_at: last.observed_at,
  };
}
