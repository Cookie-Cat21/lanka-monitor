"use client";

import { motion } from "framer-motion";
import FreshnessBadge from "@/components/FreshnessBadge";
import Sparkline from "@/components/Sparkline";
import {
  cseMarketHint,
  cseMarketLabel,
  getCseMarketPhase,
  type CseMarketPhase,
} from "@/lib/cse-market";
import { indexDelta } from "@/lib/cse";
import type { CseData, CseIndex, SourceStatus } from "@/lib/types";

const PHASE_STYLE: Record<CseMarketPhase, string> = {
  open: "text-fresh",
  pre_open: "text-stale",
  closed: "text-text-dim",
  weekend: "text-text-dim",
};

function fmtIndex(n: number) {
  return n.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function Delta({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const tone =
    delta > 0 ? "text-fresh" : delta < 0 ? "text-down" : "text-text-dim";
  return (
    <span className={`tabular text-xs ${tone}`} title="Change vs previous session">
      {delta > 0 ? "+" : ""}
      {fmtIndex(delta)}
    </span>
  );
}

function IndexBlock({ label, index }: { label: string; index: CseIndex }) {
  const delta = indexDelta(index.series);
  const series = index.series
    .map((p) => p.value)
    .filter((v): v is number => v !== null);
  const stroke =
    delta === null || delta === 0
      ? "#8b98a9"
      : delta > 0
        ? "#34d399"
        : "#f87171";

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-[11px] uppercase tracking-wide text-text-dim">
          {label}
        </span>
        <Delta delta={delta} />
      </div>
      {index.latest ? (
        <>
          <div className="tabular text-xl font-semibold leading-tight sm:text-2xl">
            {fmtIndex(index.latest.value)}
          </div>
          <div className="mt-1.5">
            <Sparkline values={series} height={32} stroke={stroke} />
          </div>
        </>
      ) : (
        <div className="tabular py-2 text-sm text-text-dim">—</div>
      )}
    </div>
  );
}

export default function CseCard({
  cse,
  source,
}: {
  cse: CseData;
  source: SourceStatus | null;
}) {
  const status = source?.status ?? "down";
  const phase = getCseMarketPhase();
  const hint = cseMarketHint(phase);
  const hasData = cse.aspi.latest || cse.sl20.latest;
  const observedAt =
    cse.aspi.latest?.observed_at ?? cse.sl20.latest?.observed_at ?? null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-xl border border-panel-edge bg-panel p-3 sm:p-4"
    >
      <header className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-zinc-300">CSE</h2>
          <p className={`tabular text-[11px] ${PHASE_STYLE[phase]}`}>
            {cseMarketLabel(phase)}
            {hint ? (
              <>
                <span className="text-text-dim"> · </span>
                <span className="text-text-dim">{hint}</span>
              </>
            ) : null}
          </p>
        </div>
        <FreshnessBadge
          status={status}
          lastSuccessAt={source?.last_success_at ?? null}
        />
      </header>

      {hasData ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <IndexBlock label="ASPI" index={cse.aspi} />
            <IndexBlock label="S&amp;P SL20" index={cse.sl20} />
          </div>
          <footer className="mt-2 text-[11px] text-text-dim">
            {phase === "open" ? "Live session" : "Last close"}{" "}
            {observedAt ? (
              <time className="tabular">{observedAt.slice(0, 10)}</time>
            ) : null}{" "}
            · Colombo Stock Exchange
          </footer>
        </>
      ) : (
        <div className="py-4 text-sm text-text-dim">
          No index data yet. Source is{" "}
          <span className="text-down">{status}</span> — this card refuses to
          guess.
        </div>
      )}
    </motion.article>
  );
}
