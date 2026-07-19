/** Sri Lanka Cost-of-Living Economic Stress Index (SLCESI) — transparent composite. */

export interface SlcesiComponent {
  id: "food" | "fuel" | "lpg" | "inflation";
  label: string;
  source: string;
  weight: number;
  /** Index level rebased to 100 at reference date. */
  index: number;
  /** Change in index points vs previous observation. */
  delta: number;
  rawValue: string;
  observedAt: string;
}

export interface SlcesiData {
  /** Composite index; 100 = Jan 2020 household basket baseline. */
  value: number;
  delta: number;
  asOf: string;
  referenceLabel: string;
  components: SlcesiComponent[];
  series: number[];
  /** True when any component source is missing — card refuses to guess. */
  incomplete: boolean;
}

export const SLCESI_METHODOLOGY = {
  formula:
    "SLCESI = Σ (weight × component index). Each component index = (today ÷ Jan 2020 baseline) × 100.",
  weights: [
    { id: "food", label: "Food basket", weight: 0.4, source: "DCS CCPI — Food (non-alcoholic)" },
    { id: "fuel", label: "Pump fuel", weight: 0.25, source: "CEYPETCO — Octane 92" },
    { id: "lpg", label: "Household gas", weight: 0.15, source: "Litro — 12.5 kg cylinder" },
    {
      id: "inflation",
      label: "Headline inflation",
      weight: 0.2,
      source: "CBSL CCPI — year-on-year %",
    },
  ],
} as const;

function composite(components: SlcesiComponent[]): number {
  return components.reduce((sum, c) => sum + c.weight * c.index, 0);
}

/** Demo readings until CEYPETCO + CCPI ingest ships. Values mirror public Apr 2026 order-of-magnitude. */
export function getSlcesiData(): SlcesiData {
  const components: SlcesiComponent[] = [
    {
      id: "food",
      label: "Food",
      source: "DCS CCPI — Food",
      weight: 0.4,
      index: 187.4,
      delta: 1.2,
      rawValue: "187.4 pts",
      observedAt: "2026-04-30",
    },
    {
      id: "fuel",
      label: "Fuel",
      source: "CEYPETCO — Octane 92",
      weight: 0.25,
      index: 212.0,
      delta: 0,
      rawValue: "Rs 363/L",
      observedAt: "2026-04-15",
    },
    {
      id: "lpg",
      label: "LPG",
      source: "Litro — 12.5 kg",
      weight: 0.15,
      index: 198.5,
      delta: 0.8,
      rawValue: "Rs 4,860",
      observedAt: "2026-04-01",
    },
    {
      id: "inflation",
      label: "Inflation",
      source: "CBSL CCPI YoY",
      weight: 0.2,
      index: 105.4,
      delta: 3.2,
      rawValue: "5.4% YoY",
      observedAt: "2026-04-30",
    },
  ];

  const value = Math.round(composite(components) * 10) / 10;
  const prevValue =
    composite(
      components.map((c) => ({ ...c, index: c.index - c.delta })),
    );
  const delta = Math.round((value - prevValue) * 10) / 10;

  return {
    value,
    delta,
    asOf: "2026-04-30",
    referenceLabel: "Jan 2020 basket = 100",
    components,
    series: [168, 171, 173, 176, 178, 181, 183, 186, 188, value],
    incomplete: true,
  };
}

export function slcesiShareText(data: SlcesiData, origin = ""): string {
  const sign = data.delta > 0 ? "+" : "";
  const url = origin || "https://lanka-monitor.vercel.app";
  return `SLCESI ${data.value} (${sign}${data.delta} vs prior) · ${data.asOf} · ${url}`;
}
