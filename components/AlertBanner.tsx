"use client";

import { useState } from "react";
import { X, TriangleAlert } from "lucide-react";
import type { SeismicWatchData } from "@/lib/types";

interface AlertBannerProps {
  seismic?: SeismicWatchData | null;
  /** Extra freeform alerts from the events table or power events */
  alerts?: { message: string; severity: number; url?: string }[];
}

function severity(seismic: SeismicWatchData): number {
  const e = seismic.alert;
  if (!e) return 0;
  if (e.tsunami) return 5;
  if (e.magnitude >= 7) return 4;
  if (e.magnitude >= 6.5 && e.distance_km <= 2000) return 4;
  return 3;
}

/**
 * Sticky life-safety banner shown for severity >= 4 events.
 * Dismissible per-session via local state.
 */
export default function AlertBanner({ seismic, alerts = [] }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const seismicSev = seismic?.status === "watch" ? severity(seismic) : 0;
  const extraHigh = alerts.filter((a) => a.severity >= 4);

  const showSeismic = seismicSev >= 4 && seismic?.alert;
  const showExtra = extraHigh.length > 0;

  if (!showSeismic && !showExtra) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mb-4 flex items-start gap-3 rounded-xl border border-stale/40 bg-stale/10 px-4 py-3"
    >
      <TriangleAlert
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
        aria-hidden
      />
      <div className="min-w-0 flex-1 text-sm">
        {showSeismic && seismic?.alert && (
          <p className="text-ink-soft">
            <span className="font-semibold">Indian Ocean Watch</span> — M
            {seismic.alert.magnitude.toFixed(1)} at {seismic.alert.place},{" "}
            {seismic.alert.distance_km.toLocaleString()} km from Colombo.
            {seismic.alert.tsunami
              ? " USGS tsunami property set — follow Department of Meteorology coastal advice."
              : " Large nearby earthquake — not an official warning."}
            {" "}
            <a
              href={seismic.alert.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-amber-500/40 underline-offset-2 hover:text-amber-50"
            >
              USGS event ↗
            </a>
          </p>
        )}
        {extraHigh.map((a, i) => (
          <p key={i} className="text-ink-soft">
            {a.message}
            {a.url && (
              <>
                {" "}
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-amber-500/40 underline-offset-2 hover:text-amber-50"
                >
                  Details ↗
                </a>
              </>
            )}
          </p>
        ))}
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss alert"
        className="shrink-0 rounded p-0.5 text-amber-300/70 hover:text-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-stale"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
