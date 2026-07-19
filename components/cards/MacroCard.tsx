"use client";

import { motion } from "framer-motion";
import FreshnessBadge from "@/components/FreshnessBadge";
import {
  formatMacroMonth,
  type MacroData,
  type MacroDeltaTone,
} from "@/lib/macro";

const DELTA_CLASS: Record<MacroDeltaTone, string> = {
  positive: "text-fresh",
  negative: "text-down",
  neutral: "text-muted",
};

function MetricCell({
  label,
  source,
  value,
  delta,
  deltaTone,
}: {
  label: string;
  source: string;
  value: string;
  delta: string | null;
  deltaTone: MacroDeltaTone;
}) {
  return (
    <div className="rounded-md bg-canvas px-2.5 py-2">
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-[11px] text-ink-soft">{label}</span>
        <span className="text-[10px] uppercase tracking-wide text-muted">
          {source}
        </span>
      </div>
      <div className="tabular mt-0.5 text-lg font-semibold leading-tight">
        {value}
      </div>
      {delta ? (
        <div className={`tabular mt-0.5 text-[11px] ${DELTA_CLASS[deltaTone]}`}>
          {delta}
        </div>
      ) : null}
    </div>
  );
}

export default function MacroCard({ data }: { data: MacroData }) {
  const status = data.incomplete ? ("stale" as const) : ("fresh" as const);

  return (
    <motion.article
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl border border-panel-edge bg-panel p-4 sm:col-span-2 sm:p-5 lg:col-span-2"
    >
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-ink-soft">Monthly macro</h2>
          <p className="text-[11px] text-muted">
            Official releases · monthly cadence
          </p>
        </div>
        <FreshnessBadge status={status} lastSuccessAt={data.asOf + "-01"} />
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5">
        {data.metrics.map((m) => (
          <MetricCell
            key={m.id}
            label={m.label}
            source={m.source}
            value={m.value}
            delta={m.delta}
            deltaTone={m.deltaTone}
          />
        ))}
      </div>

      <footer className="mt-3 text-[11px] text-muted">
        As of <time className="tabular">{formatMacroMonth(data.asOf)}</time> · CBSL
        · DCS · SLTDA
        {data.incomplete &&
          " · demo values until monthly ingest is live"}
      </footer>
    </motion.article>
  );
}
