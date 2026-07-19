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

// ── Fuel ─────────────────────────────────────────────────────────────────────

export interface FuelSeriesPoint {
  date: string;
  petrol_92: number | null;
  petrol_95: number | null;
  diesel: number | null;
  kerosene: number | null;
}

export interface FuelLatest {
  petrol_92: number | null;
  petrol_95: number | null;
  diesel: number | null;
  kerosene: number | null;
  observed_at: string;
}

export interface FuelData {
  latest: FuelLatest | null;
  series: FuelSeriesPoint[];
}

// ── Weather ───────────────────────────────────────────────────────────────────

export interface WeatherCurrent {
  temp_c: number;
  rain_mm: number;
  wind_kmh: number;
  humidity_pct: number;
  weather_code: number;
  weather_label: string;
  observed_at: string;
}

export interface WeatherData {
  current: WeatherCurrent | null;
  precip_pct_next6h: number | null;
  location: string;
}

// ── Power ─────────────────────────────────────────────────────────────────────

export interface PowerDayCount {
  date: string;
  count: number;
}

export interface PowerData {
  active_outages: number | null;
  series: PowerDayCount[];
  observed_at: string | null;
}

// ── News ──────────────────────────────────────────────────────────────────────

export interface NewsArticle {
  id?: string;
  title: string;
  source: string | null;
  url: string | null;
  published_at: string | null;
  cluster?: string | null;
}

export interface NewsCluster {
  label: string;
  articles: NewsArticle[];
}

export interface NewsData {
  articles: NewsArticle[];
  clusters: NewsCluster[];
}

// ── Brief ─────────────────────────────────────────────────────────────────────

export type BriefLocale = "en" | "si" | "ta";

export interface BriefCitation {
  n: number;
  title: string;
  url: string;
}

export interface BriefData {
  id: string | null;
  brief_date: string | null;
  en: string | null;
  si: string | null;
  ta: string | null;
  headline: string | null;
  citations: BriefCitation[];
  is_fallback: boolean;
  model: string | null;
  created_at: string | null;
  locale_available: BriefLocale[];
}

// ── Dengue ────────────────────────────────────────────────────────────────────

export interface DengueDistrict {
  name: string;
  cases: number;
}

export interface DengueNational {
  cases: number;
  week_ending: string;
  wow_delta: number | null;
}

export interface DengueData {
  national: DengueNational | null;
  districts: DengueDistrict[];
}

// ── Cricket ───────────────────────────────────────────────────────────────────

export type CricketFeedStatus = "inactive" | "live" | "recent" | "scheduled";

export interface CricketMatch {
  id: string;
  title: string;
  status: string;
  team_a: string;
  team_b: string;
  score_a: string | null;
  score_b: string | null;
  result: string | null;
  starts_at: string | null;
  is_live: boolean;
}

export interface CricketData {
  feed_status: CricketFeedStatus;
  match: CricketMatch | null;
  message: string;
}
