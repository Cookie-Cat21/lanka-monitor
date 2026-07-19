import { rest } from "./db";
import type { FxData, FxPoint, Observation, SourceStatus } from "./types";

export async function getSourceStatuses(): Promise<SourceStatus[] | null> {
  return rest<SourceStatus[]>("source_status?select=*&order=id.asc", 120);
}

export async function getFxData(): Promise<FxData> {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const rows = await rest<Observation[]>(
    `observations?source_id=eq.cbsl_fx&metric=in.(usd_lkr_buy,usd_lkr_sell)` +
      `&observed_at=gte.${since}&order=observed_at.asc&select=metric,value,observed_at`,
    300
  );
  if (!rows || rows.length === 0) return { latest: null, series: [] };

  const byDate = new Map<string, FxPoint>();
  for (const row of rows) {
    const date = row.observed_at.slice(0, 10);
    const point = byDate.get(date) ?? { date, buy: null, sell: null };
    if (row.metric === "usd_lkr_buy") point.buy = Number(row.value);
    if (row.metric === "usd_lkr_sell") point.sell = Number(row.value);
    byDate.set(date, point);
  }
  const series = [...byDate.values()].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const last = [...series].reverse().find((p) => p.buy !== null && p.sell !== null);
  const lastObserved = rows[rows.length - 1].observed_at;
  return {
    latest: last
      ? { buy: last.buy as number, sell: last.sell as number, observed_at: lastObserved }
      : null,
    series,
  };
}
