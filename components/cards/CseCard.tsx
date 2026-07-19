"use client";

import CardShell from "@/components/CardShell";
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
  closed: "text-muted",
  weekend: "text-muted",
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
    delta > 0 ? "text-fresh" : delta < 0 ? "text-down" : "text-muted";
  return (
    <span
      className={`tabular text-xs font-semibold ${tone}`}
      title="Change vs previous session"
    >
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
      ? "#5a727a"
      : delta > 0
        ? "#16a34a"
        : "#b91c1c";

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          {label}
        </span>
        <Delta delta={delta} />
      </div>
      {index.latest ? (
        <>
          <div className="kpi-value text-xl font-semibold leading-tight text-ink sm:text-2xl">
            {fmtIndex(index.latest.value)}
          </div>
          <div className="mt-1.5">
            <Sparkline values={series} height={32} stroke={stroke} />
          </div>
        </>
      ) : (
        <div className="tabular py-2 text-sm text-muted">—</div>
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
    <CardShell
      title="CSE"
      status={status}
      source={source}
      subtitle={
        <span className={PHASE_STYLE[phase]}>
          {cseMarketLabel(phase)}
          {hint ? <span className="text-muted"> · {hint}</span> : null}
        </span>
      }
      footer={
        hasData ? (
          <>
            {phase === "open" ? "Live session" : "Last close"}{" "}
            {observedAt ? (
              <time className="tabular">{observedAt.slice(0, 10)}</time>
            ) : null}{" "}
            · Colombo Stock Exchange
          </>
        ) : undefined
      }
    >
      {hasData ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <IndexBlock label="ASPI" index={cse.aspi} />
          <IndexBlock label="S&P SL20" index={cse.sl20} />
        </div>
      ) : (
        <div className="py-4 text-sm text-muted">
          No index data yet. Source is{" "}
          <span className="font-semibold text-down">{status}</span> — this card
          refuses to guess.
        </div>
      )}
    </CardShell>
  );
}
