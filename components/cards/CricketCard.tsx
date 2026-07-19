"use client";

import { Trophy } from "lucide-react";
import CardShell from "@/components/CardShell";
import RelativeTime from "@/components/RelativeTime";
import type { CricketData } from "@/lib/types";

export default function CricketCard({ cricket }: { cricket: CricketData }) {
  const isActive = cricket.feed_status !== "inactive";
  const m = cricket.match;

  return (
    <CardShell
      title="Cricket"
      subtitle="Sri Lanka"
      status={isActive ? "fresh" : "inactive"}
      lastSuccessAt={m?.starts_at ?? null}
    >
      {m ? (
        <div className="space-y-2">
          {/* Live indicator */}
          {m.is_live && (
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fresh" aria-hidden />
              <span className="text-xs font-medium text-fresh">Live</span>
            </div>
          )}

          {/* Match title */}
          <p className="text-xs text-muted leading-snug">{m.title}</p>

          {/* Score grid */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted truncate">
                {m.team_a}
              </div>
              <div className="tabular text-xl font-semibold leading-tight">
                {m.score_a ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted truncate">
                {m.team_b}
              </div>
              <div className="tabular text-xl font-semibold leading-tight">
                {m.score_b ?? "—"}
              </div>
            </div>
          </div>

          {/* Status / result */}
          <p className="text-xs text-muted leading-snug">{m.status}</p>

          {m.starts_at && !m.is_live && (
            <p className="text-[11px] text-muted">
              <RelativeTime iso={m.starts_at} />
            </p>
          )}
        </div>
      ) : (
        <div className="flex gap-3 py-2">
          <Trophy
            className="mt-0.5 h-4 w-4 shrink-0 text-muted"
            strokeWidth={1.75}
            aria-hidden
          />
          <p className="text-sm text-muted leading-relaxed">{cricket.message}</p>
        </div>
      )}
    </CardShell>
  );
}
