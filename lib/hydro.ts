import type { HydroData, SourceStatus } from "@/lib/types";

/** Illustrative drought-era snapshot — swap for live Mahaweli / CEB ingest. */
export const HYDRO_DEMO: HydroData = {
  observed_at: "2026-07-18T06:00:00+05:30",
  narrative:
    "Reservoir storage drives hydro output. When levels fall, CEB leans on diesel and schedules cuts.",
  reservoirs: [
    { id: "victoria", name: "Victoria", pct: 38, capacity_mcm: 722 },
    { id: "randenigala", name: "Randenigala", pct: 44, capacity_mcm: 860 },
    { id: "samanala", name: "Samanala", pct: 31, capacity_mcm: 278 },
    { id: "kotmale", name: "Kotmale", pct: 52, capacity_mcm: 174 },
    { id: "castlereagh", name: "Castlereagh", pct: 54, capacity_mcm: 960 },
  ],
  hydro_mw_available: 920,
  hydro_mw_installed: 1420,
};

export async function getHydroData(): Promise<HydroData> {
  return HYDRO_DEMO;
}

export async function getHydroSourceStatus(): Promise<SourceStatus | null> {
  return {
    id: "mahaweli_reservoirs",
    name: "Mahaweli reservoir levels",
    category: "power",
    expected_cadence_minutes: 1440,
    active: false,
    last_success_at: null,
    last_run_at: null,
    last_error: null,
    consecutive_failures: null,
    status: "inactive",
  };
}
