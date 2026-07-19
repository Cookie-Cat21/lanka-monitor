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
  meta?: Record<string, unknown>;
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

export type AqiCategory =
  | "good"
  | "moderate"
  | "sensitive"
  | "unhealthy"
  | "very_unhealthy"
  | "hazardous";

export interface AqiReading {
  aqi: number;
  pm25: number;
  category: AqiCategory;
  observed_at: string;
}

export interface AqiData {
  latest: AqiReading | null;
  location: string | null;
}

export interface ReservoirLevel {
  id: string;
  name: string;
  /** Percent of active storage capacity. */
  pct: number;
  capacity_mcm: number;
}

export interface HydroData {
  observed_at: string;
  /** One-line drought → power link for story contexts. */
  narrative: string;
  reservoirs: ReservoirLevel[];
  hydro_mw_available: number;
  hydro_mw_installed: number;
}

export interface CseIndexPoint {
  date: string;
  value: number | null;
}

export interface CseIndex {
  latest: { value: number; observed_at: string } | null;
  series: CseIndexPoint[];
}

export interface CseData {
  aspi: CseIndex;
  sl20: CseIndex;
}

export type { SeismicEvent, SeismicWatchData } from "./seismic";
