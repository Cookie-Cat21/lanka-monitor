"use client";

import CardShell from "@/components/CardShell";
import CountUp from "@/components/CountUp";
import Sparkline from "@/components/Sparkline";
import type { FxData, SourceStatus } from "@/lib/types";

export default function FxCard({
  fx,
  source,
}: {
  fx: FxData;
  source: SourceStatus | null;
}) {
  const status = source?.status ?? "down";
  const sellSeries = fx.series
    .map((p) => p.sell)
    .filter((v): v is number => v !== null);

  const delta =
    sellSeries.length >= 2
      ? sellSeries[sellSeries.length - 1] - sellSeries[sellSeries.length - 2]
      : null;

  return (
    <CardShell
      title="USD / LKR"
      source={source}
      status={status}
      footer={
        fx.latest ? (
          <>
            Rate for{" "}
            <time className="tabular">{fx.latest.observed_at.slice(0, 10)}</time>{" "}
            · Central Bank of Sri Lanka indicative rates
          </>
        ) : undefined
      }
    >
      {fx.latest ? (
        <>
          <div className="flex items-end gap-5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Selling
              </div>
              <div className="kpi-value text-4xl font-semibold text-ink">
                <CountUp value={fx.latest.sell} />
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Buying
              </div>
              <div className="tabular text-xl font-semibold text-ink-soft">
                {fx.latest.buy.toFixed(2)}
              </div>
            </div>
            {delta !== null && (
              <div
                className={`tabular mb-1 ml-auto text-sm font-semibold ${
                  delta > 0
                    ? "text-down"
                    : delta < 0
                      ? "text-fresh"
                      : "text-muted"
                }`}
                title="Change vs previous day (selling rate). Up = weaker rupee."
              >
                {delta > 0 ? "+" : ""}
                {delta.toFixed(2)}
              </div>
            )}
          </div>

          <div className="mt-4">
            <Sparkline values={sellSeries} stroke="#18181b" />
          </div>
        </>
      ) : (
        <div className="py-6 text-sm text-muted">
          No exchange-rate data available. The source is{" "}
          <span className="font-semibold text-down">{status}</span> — this card
          refuses to guess.
        </div>
      )}
    </CardShell>
  );
}
