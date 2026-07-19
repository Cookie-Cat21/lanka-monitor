"use client";

import type { PowerDayCount } from "@/lib/types";

/** Colour a single day segment based on outage count. Matches Tremor Tracker pattern. */
function segmentColour(count: number): string {
  if (count === 0) return "bg-fresh/70";
  if (count <= 3) return "bg-stale/80";
  return "bg-down/80";
}

function segmentLabel(count: number): string {
  if (count === 0) return "No outages";
  if (count === 1) return "1 outage";
  return `${count} outages`;
}

/**
 * Tremor-style segment tracker strip.
 * Renders one coloured block per day; green = 0 outages, amber = 1–3, red = 4+.
 */
export default function Tracker({
  series,
  days = 14,
}: {
  series: PowerDayCount[];
  days?: number;
}) {
  // Pad to `days` entries, filling gaps with 0
  const now = Date.now();
  const segments: PowerDayCount[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * 86_400_000).toISOString().slice(0, 10);
    const found = series.find((s) => s.date === date);
    segments.push(found ?? { date, count: 0 });
  }

  return (
    <div
      aria-label="14-day power outage tracker"
      className="flex gap-0.5"
      role="img"
    >
      {segments.map((seg) => (
        <div
          key={seg.date}
          title={`${seg.date} — ${segmentLabel(seg.count)}`}
          aria-label={`${seg.date}: ${segmentLabel(seg.count)}`}
          className={`h-7 flex-1 rounded-sm ${segmentColour(seg.count)} transition-opacity hover:opacity-90`}
        />
      ))}
    </div>
  );
}
