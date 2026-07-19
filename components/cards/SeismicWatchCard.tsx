"use client";

import RelativeTime from "@/components/RelativeTime";
import type { SeismicWatchData } from "@/lib/seismic";

export default function SeismicWatchCard({ data }: { data: SeismicWatchData }) {
  const active = data.status === "watch" && data.alert;

  if (active && data.alert) {
    const e = data.alert;
    return (
      <article
        className="mb-3 rounded-2xl border border-stale/40 bg-stale/5 p-4 sm:p-5"
        style={{ borderLeftWidth: "3px", borderLeftColor: "var(--color-stale)" }}
        aria-live="assertive"
      >
        <header className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-stale">Indian Ocean watch</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-stale/10 px-2 py-0.5 text-xs font-medium text-stale">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-stale" />
            {e.tsunami ? "Tsunami flag" : "Seismic alert"}
          </span>
        </header>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="kpi-value text-3xl font-semibold text-ink">
            M{e.magnitude.toFixed(1)}
          </span>
          <span className="min-w-0 text-sm text-ink-soft">{e.place}</span>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-muted">
          {e.distance_km.toLocaleString()} km from Colombo · {e.depth_km.toFixed(0)} km
          deep · <RelativeTime iso={e.observed_at} />
          {e.tsunami
            ? " · USGS tsunami property set — follow Dept. of Meteorology coastal advice."
            : " · Large nearby quake — not an official warning."}
        </p>

        <footer className="mt-2 text-xs text-muted">
          <a
            className="link-quiet"
            href={e.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            USGS event
          </a>
          {" · checked "}
          <RelativeTime iso={data.checked_at} />
        </footer>
      </article>
    );
  }

  return (
    <article
      className="mb-3 flex items-center gap-2 rounded-2xl border border-panel-edge bg-panel/90 px-3.5 py-2.5 sm:gap-3 sm:px-4"
      aria-label="Indian Ocean earthquake watch — quiet"
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-fresh" aria-hidden />
      <h2 className="font-display shrink-0 text-xs font-semibold text-ink sm:text-sm">
        Indian Ocean watch
      </h2>
      <span className="min-w-0 truncate text-xs text-muted">
        {data.status === "error"
          ? "USGS unreachable — retrying"
          : "Quiet · no Sri Lanka reach in 72 h"}
      </span>
      <span className="tabular ml-auto shrink-0 text-[11px] text-muted sm:text-xs">
        USGS · <RelativeTime iso={data.checked_at} />
      </span>
    </article>
  );
}
