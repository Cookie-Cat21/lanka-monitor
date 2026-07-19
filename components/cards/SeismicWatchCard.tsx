"use client";

import { motion } from "framer-motion";
import type { SeismicWatchData } from "@/lib/seismic";

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function SeismicWatchCard({ data }: { data: SeismicWatchData }) {
  const active = data.status === "watch" && data.alert;
  const checked = relativeTime(data.checked_at);

  if (active && data.alert) {
    const e = data.alert;
    return (
      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 sm:p-5"
        style={{ borderLeftWidth: "3px", borderLeftColor: "#fbbf24" }}
        aria-live="assertive"
      >
        <header className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-amber-100">Indian Ocean watch</h2>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            {e.tsunami ? "Tsunami flag" : "Seismic alert"}
          </span>
        </header>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="tabular text-3xl font-semibold text-amber-50">
            M{e.magnitude.toFixed(1)}
          </span>
          <span className="min-w-0 text-sm text-zinc-200">{e.place}</span>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-amber-100/80">
          {e.distance_km.toLocaleString()} km from Colombo · {e.depth_km.toFixed(0)} km deep ·{" "}
          <time className="tabular">{relativeTime(e.observed_at)}</time>
          {e.tsunami
            ? " · USGS tsunami property set — follow Dept. of Meteorology coastal advice."
            : " · Large nearby quake — not an official warning."}
        </p>

        <footer className="mt-2 text-xs text-text-dim">
          <a
            className="underline decoration-panel-edge underline-offset-2 hover:text-zinc-300"
            href={e.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            USGS event
          </a>
          {" · checked "}
          <time className="tabular">{checked}</time>
        </footer>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex items-center gap-2 rounded-lg border border-panel-edge/40 bg-panel/25 px-3 py-2.5 sm:gap-3 sm:px-4"
      aria-label="Indian Ocean earthquake watch — quiet"
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" aria-hidden />
      <h2 className="shrink-0 text-xs font-medium text-zinc-500 sm:text-sm">
        Indian Ocean watch
      </h2>
      <span className="min-w-0 truncate text-xs text-text-dim">
        {data.status === "error"
          ? "USGS unreachable — retrying"
          : "Quiet · no Sri Lanka reach in 72 h"}
      </span>
      <time className="tabular ml-auto shrink-0 text-[11px] text-text-dim sm:text-xs">
        USGS · {checked}
      </time>
    </motion.article>
  );
}
