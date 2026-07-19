"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import FreshnessBadge from "@/components/FreshnessBadge";
import Sparkline from "@/components/Sparkline";
import {
  COCONUT_SOURCE,
  coconutShareText,
  type CoconutIndexData,
} from "@/lib/coconut-index";

function deltaClass(d: number): string {
  if (d > 0) return "text-down";
  if (d < 0) return "text-fresh";
  return "text-muted";
}

export default function CoconutIndexCard({
  data,
  standalone = false,
}: {
  data: CoconutIndexData;
  standalone?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const status = data.demo ? ("stale" as const) : ("fresh" as const);

  async function share() {
    const text = coconutShareText(data, window.location.origin);
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Coconut Index · Lanka Monitor",
          text,
          url: `${window.location.origin}/coconut`,
        });
        return;
      }
    } catch {
      /* cancelled or unsupported */
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.article
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`rounded-2xl border border-panel-edge bg-panel ${
        standalone ? "p-6 sm:p-8" : "p-4 sm:p-5"
      }`}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Lanka Monitor</p>
          <h1
            className={`mt-1 font-semibold tracking-tight text-ink ${
              standalone ? "text-xl sm:text-2xl" : "text-base"
            }`}
          >
            Coconut Index
          </h1>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted">
            One nut, one rupee — the unofficial grocery pulse. Colombo retail from HARTI.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <FreshnessBadge status={status} lastSuccessAt={data.asOf} />
          <button
            type="button"
            onClick={share}
            className="rounded-md border border-panel-edge px-2.5 py-1 text-xs text-ink-soft hover:bg-panel-edge/60"
          >
            {copied ? "Copied" : "Share"}
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-3 sm:gap-4">
        <div>
          <div
            className={`tabular font-semibold tracking-tight ${
              standalone ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl"
            }`}
          >
            <span className="mr-1 text-2xl font-normal text-muted sm:text-3xl">Rs</span>
            {data.price}
          </div>
          <p className="mt-1 text-xs text-muted">
            {data.commodity} · {data.market}
          </p>
        </div>
        <p className={`tabular text-sm ${deltaClass(data.delta)}`}>
          {data.delta > 0 ? "+" : ""}
          {data.delta} vs prior reading
        </p>
      </div>

      <div className="mt-5">
        <Sparkline values={data.series} stroke="#a3e635" height={standalone ? 56 : 48} />
      </div>

      <footer className="mt-4 text-xs leading-relaxed text-muted">
        As of <time className="tabular">{data.asOf}</time> ·{" "}
        <a
          href={COCONUT_SOURCE.url}
          className="underline decoration-panel-edge underline-offset-2 hover:text-ink-soft"
          rel="noopener noreferrer"
          target="_blank"
        >
          {COCONUT_SOURCE.label}
        </a>
        {data.demo && " · demo until live ingest"}
      </footer>
    </motion.article>
  );
}
