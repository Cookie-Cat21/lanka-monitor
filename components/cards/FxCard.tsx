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
              <div className="text-xs uppercase tracking-wide text-text-dim">
                Selling
              </div>
              <div className="tabular text-3xl font-semibold">
                <CountUp value={fx.latest.sell} />
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-text-dim">
                Buying
              </div>
              <div className="tabular text-xl text-zinc-300">
                {fx.latest.buy.toFixed(2)}
              </div>
            </div>
            {delta !== null && (
              <div
                className={`tabular mb-1 ml-auto text-sm ${
                  delta > 0
                    ? "text-down"
                    : delta < 0
                      ? "text-fresh"
                      : "text-text-dim"
                }`}
                title="Change vs previous day (selling rate). Up = weaker rupee."
              >
                {delta > 0 ? "+" : ""}
                {delta.toFixed(2)}
              </div>
            )}
          </div>

          <div className="mt-4">
            <Sparkline values={sellSeries} />
          </div>
        </>
      ) : (
        <div className="py-6 text-sm text-text-dim">
          No exchange-rate data available. The source is{" "}
          <span className="text-down">{status}</span> — this card refuses to
          guess.
        </div>
      )}
    </CardShell>
  );
}
