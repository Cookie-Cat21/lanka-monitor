"use client";

import { motion } from "framer-motion";
import FreshnessBadge from "@/components/FreshnessBadge";
import { AQI_SCALE } from "@/lib/aqi";
import type { AqiData, SourceStatus } from "@/lib/types";

export default function AqiCard({
  aqi,
  source,
}: {
  aqi: AqiData;
  source: SourceStatus | null;
}) {
  const status = source?.status ?? "down";
  const reading = aqi.latest;
  const scale = reading ? AQI_SCALE[reading.category] : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
      className="rounded-xl border border-panel-edge bg-panel p-4 sm:p-5"
      style={
        scale
          ? {
              borderLeftWidth: "3px",
              borderLeftColor: scale.accent,
              backgroundColor: `color-mix(in srgb, ${scale.tint} 100%, var(--color-panel))`,
            }
          : undefined
      }
    >
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium text-zinc-300">Colombo air</h2>
        <FreshnessBadge
          status={status}
          lastSuccessAt={source?.last_success_at ?? null}
        />
      </header>

      {reading && scale ? (
        <>
          <div className="flex items-end gap-3">
            <div className="tabular text-3xl font-semibold">{reading.aqi}</div>
            <span
              className="mb-1 rounded-md border px-2 py-0.5 text-xs font-medium tracking-wide"
              style={{
                color: scale.text,
                borderColor: scale.accent,
                backgroundColor: scale.tint,
              }}
            >
              {scale.label}
            </span>
            <div className="mb-1 ml-auto text-right">
              <div className="text-xs uppercase tracking-wide text-text-dim">
                PM2.5
              </div>
              <div className="tabular text-sm text-zinc-300">
                {reading.pm25.toFixed(1)}{" "}
                <span className="text-text-dim">µg/m³</span>
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-text-dim">
            Haze season (Dec–Feb) lifts fine particles across the western
            province. Every reading shows its category label beside colour — never
            colour alone. Check before long outdoor exertion.
          </p>

          <footer className="mt-2 text-xs text-text-dim">
            {aqi.location ? (
              <>
                <span>{aqi.location}</span>
                <span aria-hidden> · </span>
              </>
            ) : null}
            <time className="tabular">{reading.observed_at.slice(0, 16).replace("T", " ")} UTC</time>
            {" · "}
            <a
              className="underline decoration-panel-edge underline-offset-2 hover:text-zinc-300"
              href="https://openaq.org/"
              rel="noopener noreferrer"
              target="_blank"
            >
              OpenAQ
            </a>
            {" · US EPA AQI scale"}
          </footer>
        </>
      ) : (
        <div className="py-4 text-sm text-text-dim">
          No air-quality data yet. OpenAQ source is{" "}
          <span className="text-down">{status}</span> — set{" "}
          <code className="text-zinc-400">OPENAQ_API_KEY</code> and activate{" "}
          <code className="text-zinc-400">openaq_colombo</code> in the database.
        </div>
      )}
    </motion.article>
  );
}
