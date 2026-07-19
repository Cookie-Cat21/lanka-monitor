export type FreshnessStatus = "fresh" | "stale" | "down" | "inactive";

export interface SourceStatus {
  id: string;
  name: string;
  category: string;
  expected_cadence_minutes: number;
  active: boolean;
  last_success_at: string | null;
  last_run_at: string | null;
  last_error: string | null;
  consecutive_failures: number | null;
  status: FreshnessStatus;
}

export interface Observation {
  source_id: string;
  metric: string;
  value: number;
  unit: string | null;
  observed_at: string;
}

export interface FxPoint {
  date: string;
  buy: number | null;
  sell: number | null;
}

export interface FxData {
  latest: { buy: number; sell: number; observed_at: string } | null;
  series: FxPoint[];
}
