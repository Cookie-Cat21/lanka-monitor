"use client";

import { motion } from "framer-motion";
import FreshnessBadge from "@/components/FreshnessBadge";
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
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-xl border border-panel-edge bg-panel p-4 sm:p-5"
    >
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium text-zinc-300">USD / LKR</h2>
        <FreshnessBadge
          status={status}
          lastSuccessAt={source?.last_success_at ?? null}
        />
      </header>

      {fx.latest ? (
        <>
          <div className="flex items-end gap-5">
            <div>
              <div className="text-xs uppercase tracking-wide text-text-dim">
                Selling
              </div>
              <div className="tabular text-3xl font-semibold">
                {fx.latest.sell.toFixed(2)}
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
                title="Change vs previous day (selling rate)"
              >
                {delta > 0 ? "+" : ""}
                {delta.toFixed(2)}
              </div>
            )}
          </div>

          <div className="mt-4">
            <Sparkline values={sellSeries} />
          </div>

          <footer className="mt-2 text-xs text-text-dim">
            Rate for{" "}
            <time className="tabular">{fx.latest.observed_at.slice(0, 10)}</time>{" "}
            · Central Bank of Sri Lanka indicative rates
          </footer>
        </>
      ) : (
        <div className="py-6 text-sm text-text-dim">
          No exchange-rate data available. The source is{" "}
          <span className="text-down">{status}</span> — this card refuses to
          guess.
        </div>
      )}
    </motion.article>
  );
}
