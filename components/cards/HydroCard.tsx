"use client";

import { motion } from "framer-motion";
import FreshnessBadge from "@/components/FreshnessBadge";
import SparkBar from "@/components/SparkBar";
import type { HydroData, SourceStatus } from "@/lib/types";

function pctTone(pct: number): string {
  if (pct < 35) return "text-down";
  if (pct < 50) return "text-stale";
  return "text-fresh";
}

export default function HydroCard({
  hydro,
  source,
}: {
  hydro: HydroData;
  source: SourceStatus | null;
}) {
  const status = source?.status ?? "inactive";
  const avg =
    hydro.reservoirs.reduce((sum, r) => sum + r.pct, 0) / hydro.reservoirs.length;
  const hydroRatio = hydro.hydro_mw_available / hydro.hydro_mw_installed;

  return (
    <motion.article
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl border border-panel-edge bg-panel p-4 sm:p-5 lg:col-span-2"
    >
      <header className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium text-ink-soft">Hydro storage</h2>
        <FreshnessBadge
          status={status}
          lastSuccessAt={source?.last_success_at ?? null}
        />
      </header>

      <p className="mb-3 text-xs leading-relaxed text-muted">{hydro.narrative}</p>

      <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <div>
          <span className="text-xs uppercase tracking-wide text-muted">
            Major basins avg
          </span>
          <div className={`tabular text-2xl font-semibold ${pctTone(avg)}`}>
            {avg.toFixed(0)}%
          </div>
        </div>
        <div className="text-xs text-muted">
          <span className="tabular text-ink-soft">
            {hydro.hydro_mw_available.toLocaleString()} MW
          </span>{" "}
          hydro available of{" "}
          <span className="tabular">{hydro.hydro_mw_installed.toLocaleString()} MW</span>{" "}
          installed
          <span className={`ml-1 tabular ${hydroRatio < 0.7 ? "text-stale" : "text-muted"}`}>
            ({(hydroRatio * 100).toFixed(0)}%)
          </span>
        </div>
      </div>

      <ul className="space-y-1.5" aria-label="Top reservoir levels">
        {hydro.reservoirs.map((r) => (
          <li
            key={r.id}
            className="grid grid-cols-[minmax(5.5rem,1fr)_4.5rem_2rem] items-center gap-2 sm:grid-cols-[minmax(6rem,1fr)_5rem_2.25rem]"
          >
            <span className="truncate text-xs text-muted">{r.name}</span>
            <SparkBar value={r.pct} label={r.name} width={80} />
            <span className={`tabular text-right text-xs font-medium ${pctTone(r.pct)}`}>
              {r.pct}%
            </span>
          </li>
        ))}
      </ul>

      <footer className="mt-3 text-xs text-muted">
        As of{" "}
        <time className="tabular">{hydro.observed_at.slice(0, 10)}</time> · Mahaweli /
        CEB reservoir bulletin · dashed line marks 35% stress threshold
      </footer>
    </motion.article>
  );
}
