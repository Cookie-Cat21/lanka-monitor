"use client";

import { Activity } from "lucide-react";
import CardShell from "@/components/CardShell";
import type { DengueData } from "@/lib/types";

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const tone =
    delta > 0 ? "text-down" : delta < 0 ? "text-fresh" : "text-text-dim";
  const label = delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString();
  return (
    <span
      className={`tabular text-xs ${tone}`}
      title="Week-on-week change"
      aria-label={`${delta > 0 ? "Up" : delta < 0 ? "Down" : "No change"} ${Math.abs(delta).toLocaleString()} from previous week`}
    >
      {label} WoW
    </span>
  );
}

const MAX_DISTRICTS = 8;

export default function DengueCard({ dengue }: { dengue: DengueData }) {
  const hasNational = dengue.national !== null;
  const hasDistricts = dengue.districts.length > 0;
  const top = dengue.districts.slice(0, MAX_DISTRICTS);
  const maxCases = Math.max(...top.map((d) => d.cases), 1);

  return (
    <CardShell
      title="Dengue surveillance"
      subtitle="Epidemiology Unit"
      status={hasNational ? "fresh" : "down"}
      lastSuccessAt={dengue.national?.week_ending ?? null}
      footer={
        dengue.national ? (
          <>
            Week ending{" "}
            <time className="tabular">{dengue.national.week_ending}</time>
            {" · Ministry of Health, Sri Lanka"}
          </>
        ) : undefined
      }
    >
      {hasNational && dengue.national ? (
        <div className="space-y-4">
          {/* National figure */}
          <div>
            <div className="text-[10px] uppercase tracking-wide text-text-dim">
              National (week)
            </div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="tabular text-3xl font-semibold leading-none">
                {dengue.national.cases.toLocaleString()}
              </span>
              <DeltaBadge delta={dengue.national.wow_delta} />
            </div>
          </div>

          {/* District bar list */}
          {hasDistricts && (
            <div>
              <div className="mb-1.5 text-[10px] uppercase tracking-wide text-text-dim">
                Top districts
              </div>
              <ul className="space-y-1.5" aria-label="Dengue cases by district">
                {top.map((d) => (
                  <li key={d.name} className="flex items-center gap-2">
                    <span className="w-20 shrink-0 truncate text-xs capitalize text-zinc-400">
                      {d.name}
                    </span>
                    <div className="flex-1 overflow-hidden rounded-full bg-panel-edge">
                      <div
                        className="h-1.5 rounded-full bg-down/60 transition-all"
                        style={{ width: `${(d.cases / maxCases) * 100}%` }}
                        aria-hidden
                      />
                    </div>
                    <span className="tabular w-10 shrink-0 text-right text-xs text-zinc-400">
                      {d.cases.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-3 py-4">
          <Activity
            className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600"
            strokeWidth={1.75}
            aria-hidden
          />
          <p className="text-sm text-text-dim">
            No dengue data available. The Epidemiology Unit source is not yet
            active — this card refuses to guess.
          </p>
        </div>
      )}
    </CardShell>
  );
}
