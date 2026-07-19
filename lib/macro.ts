/** Monthly macro panel — official CBSL / DCS / SLTDA releases only. */

export type MacroMetricId =
  | "ccpi"
  | "policy_rate"
  | "reserves"
  | "remittances"
  | "arrivals";

/** Whether the delta is good, bad, or neutral for Sri Lanka macro context. */
export type MacroDeltaTone = "positive" | "negative" | "neutral";

export interface MacroMetric {
  id: MacroMetricId;
  label: string;
  source: string;
  value: string;
  delta: string | null;
  deltaTone: MacroDeltaTone;
  observedAt: string;
}

export interface MacroData {
  /** Reporting month, e.g. "2026-04". */
  asOf: string;
  metrics: MacroMetric[];
  /** True until all five monthly sources ingest live. */
  incomplete: boolean;
}

/** Demo readings until monthly macro ingest ships. Apr 2026 order-of-magnitude. */
export function getMacroData(): MacroData {
  return {
    asOf: "2026-04",
    incomplete: true,
    metrics: [
      {
        id: "ccpi",
        label: "CCPI",
        source: "DCS",
        value: "5.4% YoY",
        delta: "+0.2 pp",
        deltaTone: "negative",
        observedAt: "2026-04-30",
      },
      {
        id: "policy_rate",
        label: "Policy rate",
        source: "CBSL",
        value: "8.00%",
        delta: "unchanged",
        deltaTone: "neutral",
        observedAt: "2026-04-10",
      },
      {
        id: "reserves",
        label: "Reserves",
        source: "CBSL",
        value: "USD 5.8B",
        delta: "+USD 0.2B",
        deltaTone: "positive",
        observedAt: "2026-04-30",
      },
      {
        id: "remittances",
        label: "Remittances",
        source: "CBSL",
        value: "USD 578M",
        delta: "+2.1% YoY",
        deltaTone: "positive",
        observedAt: "2026-04-30",
      },
      {
        id: "arrivals",
        label: "SLTDA arrivals",
        source: "SLTDA",
        value: "187.4k",
        delta: "+8.0% MoM",
        deltaTone: "positive",
        observedAt: "2026-04-30",
      },
    ],
  };
}

export function formatMacroMonth(isoMonth: string): string {
  const [year, month] = isoMonth.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("en-LK", { month: "short", year: "numeric" });
}
