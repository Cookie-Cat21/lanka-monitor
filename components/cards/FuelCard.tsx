"use client";

import CardShell from "@/components/CardShell";
import type { FuelData, SourceStatus } from "@/lib/types";

const FUEL_ITEMS = [
  { key: "petrol_92" as const, label: "Petrol 92" },
  { key: "petrol_95" as const, label: "Petrol 95" },
  { key: "diesel" as const, label: "Diesel" },
  { key: "kerosene" as const, label: "Kerosene" },
] as const;

type FuelKey = (typeof FUEL_ITEMS)[number]["key"];

function delta(series: import("@/lib/types").FuelSeriesPoint[], key: FuelKey): number | null {
  const vals = series
    .map((p) => p[key])
    .filter((v): v is number => v !== null);
  if (vals.length < 2) return null;
  return vals[vals.length - 1] - vals[vals.length - 2];
}

function PriceBlock({
  label,
  price,
  d,
}: {
  label: string;
  price: number | null;
  d: number | null;
}) {
  const tone =
    d === null || d === 0
      ? "text-muted"
      : d > 0
        ? "text-down"
        : "text-fresh";

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-muted">{label}</span>
      {price !== null ? (
        <div className="flex items-baseline gap-1.5">
          <span className="tabular text-lg font-semibold leading-tight">
            {price.toFixed(2)}
          </span>
          {d !== null && (
            <span className={`tabular text-[11px] ${tone}`}>
              {d > 0 ? "+" : ""}
              {d.toFixed(2)}
            </span>
          )}
        </div>
      ) : (
        <span className="tabular text-sm text-muted">—</span>
      )}
    </div>
  );
}

export default function FuelCard({
  fuel,
  source,
}: {
  fuel: FuelData;
  source: SourceStatus | null;
}) {
  const status = source?.status ?? "down";
  const hasData = fuel.latest !== null;

  return (
    <CardShell
      title="Fuel prices"
      subtitle="LKR / litre · CEYPETCO"
      source={source}
      status={status}
      footer={
        fuel.latest ? (
          <>
            Updated{" "}
            <time className="tabular">{fuel.latest.observed_at.slice(0, 10)}</time>
            {" · CEYPETCO / Ministry of Energy"}
          </>
        ) : undefined
      }
    >
      {hasData && fuel.latest ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {FUEL_ITEMS.map(({ key, label }) => (
            <PriceBlock
              key={key}
              label={label}
              price={fuel.latest![key]}
              d={delta(fuel.series, key)}
            />
          ))}
        </div>
      ) : (
        <div className="py-6 text-sm text-muted">
          No fuel price data. Source is{" "}
          <span className="text-down">{status}</span> — this card refuses to
          guess.
        </div>
      )}
    </CardShell>
  );
}
