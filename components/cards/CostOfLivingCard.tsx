"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Sparkline from "@/components/Sparkline";
import FreshnessBadge from "@/components/FreshnessBadge";
import {
  SLCESI_METHODOLOGY,
  slcesiShareText,
  type SlcesiData,
} from "@/lib/slcesi";

function deltaClass(d: number): string {
  if (d > 0) return "text-down";
  if (d < 0) return "text-fresh";
  return "text-muted";
}

export default function CostOfLivingCard({ data }: { data: SlcesiData }) {
  const [showMethod, setShowMethod] = useState(false);
  const [copied, setCopied] = useState(false);

  async function share() {
    const text = slcesiShareText(data, window.location.origin);
    try {
      if (navigator.share) {
        await navigator.share({ title: "Lanka Monitor · SLCESI", text, url: window.location.href });
        return;
      }
    } catch {
      /* user cancelled or unsupported */
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const status = data.incomplete ? ("stale" as const) : ("fresh" as const);

  return (
    <motion.article
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl border border-panel-edge bg-panel p-4 sm:col-span-2 sm:p-5 lg:col-span-3"
    >
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-ink-soft">Daily cost pressure</h2>
          <p className="text-xs text-muted">SLCESI — food, fuel, gas &amp; inflation</p>
        </div>
        <div className="flex items-center gap-3">
          <FreshnessBadge status={status} lastSuccessAt={data.asOf} />
          <button
            type="button"
            onClick={share}
            className="rounded-md border border-panel-edge px-2 py-0.5 text-xs text-ink-soft hover:bg-panel-edge/60"
          >
            {copied ? "Copied" : "Share"}
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-4 sm:gap-6">
        <div>
          <div className="tabular text-4xl font-semibold tracking-tight sm:text-5xl">
            {data.value.toFixed(1)}
          </div>
          <div className="mt-1 text-xs text-muted">{data.referenceLabel}</div>
        </div>
        <div className={`tabular text-sm ${deltaClass(data.delta)}`}>
          {data.delta > 0 ? "+" : ""}
          {data.delta.toFixed(1)} vs prior reading
        </div>
      </div>

      <div className="mt-4">
        <Sparkline values={data.series} stroke="#fbbf24" />
      </div>

      <div className="mt-4">
        <div className="mb-2 flex h-2 overflow-hidden rounded-full bg-depth">
          {data.components.map((c) => (
            <div
              key={c.id}
              className="h-full opacity-90"
              style={{
                width: `${c.weight * 100}%`,
                backgroundColor:
                  c.id === "food"
                    ? "#34d399"
                    : c.id === "fuel"
                      ? "#fbbf24"
                      : c.id === "lpg"
                        ? "#60a5fa"
                        : "#f87171",
              }}
              title={`${c.label} ${Math.round(c.weight * 100)}%`}
            />
          ))}
        </div>
        <ul className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
          {data.components.map((c) => (
            <li
              key={c.id}
              className="flex items-baseline justify-between gap-2 rounded-md bg-canvas px-2 py-1.5"
            >
              <span className="text-ink-soft">
                {c.label}{" "}
                <span className="text-muted">({Math.round(c.weight * 100)}%)</span>
              </span>
              <span className="tabular text-right">
                {c.rawValue}
                <span className={`ml-2 ${deltaClass(c.delta)}`}>
                  {c.delta > 0 ? "+" : ""}
                  {c.delta.toFixed(1)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => setShowMethod((v) => !v)}
        className="mt-3 text-xs text-muted underline decoration-panel-edge underline-offset-2 hover:text-ink-soft"
      >
        {showMethod ? "Hide methodology" : "How this number is built"}
      </button>

      {showMethod && (
        <div className="mt-2 space-y-2 rounded-lg border border-panel-edge bg-canvas p-3 text-xs leading-relaxed text-muted">
          <p>{SLCESI_METHODOLOGY.formula}</p>
          <ul className="space-y-1">
            {SLCESI_METHODOLOGY.weights.map((w) => (
              <li key={w.id}>
                <span className="text-muted">{Math.round(w.weight * 100)}%</span> {w.label} —{" "}
                {w.source}
              </li>
            ))}
          </ul>
          <p>
            No dial or traffic-light score — only rebased public indices and published weights.
            {data.incomplete &&
              " Demo values shown; card stays stale until all four sources ingest live."}
          </p>
        </div>
      )}

      <footer className="mt-3 text-xs text-muted">
        As of <time className="tabular">{data.asOf}</time> · CBSL · DCS · CEYPETCO · Litro
      </footer>
    </motion.article>
  );
}
