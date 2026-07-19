"use client";

import { Zap } from "lucide-react";
import CardShell from "@/components/CardShell";
import Tracker from "@/components/Tracker";
import type { PowerData, SourceStatus } from "@/lib/types";

export default function PowerCard({
  power,
  source,
}: {
  power: PowerData;
  source: SourceStatus | null;
}) {
  const status = source?.status ?? "down";
  const hasData = power.active_outages !== null || power.series.length > 0;
  const isAllClear =
    hasData && power.series.every((s) => s.count === 0) && power.active_outages === 0;

  return (
    <CardShell
      title="Power outages"
      subtitle="CEB scheduled interruptions"
      source={source}
      status={status}
      footer={
        power.observed_at ? (
          <>
            Last checked{" "}
            <time className="tabular">{power.observed_at.slice(0, 16).replace("T", " ")}</time>
            {" · Ceylon Electricity Board"}
          </>
        ) : undefined
      }
    >
      {hasData ? (
        <div className="space-y-3">
          {/* Current count */}
          <div className="flex items-center gap-2">
            <Zap
              className={`h-5 w-5 shrink-0 ${
                (power.active_outages ?? 0) > 0
                  ? "text-stale"
                  : "text-fresh"
              }`}
              aria-hidden
            />
            <div>
              {isAllClear ? (
                <span className="text-sm text-fresh">No outages scheduled</span>
              ) : (
                <>
                  <span className="tabular text-xl font-semibold leading-none">
                    {power.active_outages ?? 0}
                  </span>
                  <span className="ml-1 text-xs text-text-dim">
                    active outage{power.active_outages !== 1 ? "s" : ""}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 14-day tracker strip */}
          {power.series.length > 0 && (
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-wide text-text-dim">
                14-day history
              </div>
              <Tracker series={power.series} days={14} />
              <div className="mt-1 flex justify-between text-[10px] text-text-dim">
                <span>14 days ago</span>
                <span>Today</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-6 text-sm text-text-dim">
          No outage data. Source is{" "}
          <span className="text-down">{status}</span> — this card refuses to
          guess.
        </div>
      )}
    </CardShell>
  );
}
