import { rest } from "./db";
import type { DengueData, DengueDistrict, DengueNational, Observation } from "./types";

const SOURCE_ID = "dengue_hub";

interface DistrictRow {
  metric: string;
  value: number;
  observed_at: string;
}

export async function getDengueData(): Promise<DengueData> {
  // Fetch national case total (latest week)
  const nationalRows = await rest<Observation[]>(
    `observations?source_id=eq.${SOURCE_ID}&metric=eq.dengue_national_cases` +
      `&order=observed_at.desc&limit=2&select=value,observed_at`,
    1800
  );

  let national: DengueNational | null = null;
  if (nationalRows && nationalRows.length > 0) {
    const latest = nationalRows[0];
    const prev = nationalRows[1] ?? null;
    const wow_delta =
      prev != null ? Number(latest.value) - Number(prev.value) : null;
    national = {
      cases: Number(latest.value),
      week_ending: latest.observed_at.slice(0, 10),
      wow_delta,
    };
  }

  // Fetch district breakdown for latest week
  const since = national
    ? national.week_ending
    : new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const districtRows = await rest<DistrictRow[]>(
    `observations?source_id=eq.${SOURCE_ID}` +
      `&metric=like.dengue_district_*` +
      `&observed_at=gte.${since}T00:00:00` +
      `&order=value.desc&limit=25&select=metric,value,observed_at`,
    1800
  );

  const districts: DengueDistrict[] = (districtRows ?? []).map((r) => ({
    name: r.metric.replace("dengue_district_", "").replace(/_/g, " "),
    cases: Number(r.value),
  }));

  return { national, districts };
}
