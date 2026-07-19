import type { FreshnessStatus } from "@/lib/types";

const STYLES: Record<FreshnessStatus, { dot: string; label: string; text: string }> = {
  fresh: { dot: "bg-fresh", label: "fresh", text: "text-fresh" },
  stale: { dot: "bg-stale", label: "stale", text: "text-stale" },
  down: { dot: "bg-down", label: "down", text: "text-down" },
  inactive: { dot: "bg-zinc-600", label: "coming soon", text: "text-zinc-500" },
};

function relativeTime(iso: string | null): string {
  if (!iso) return "no data yet";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function FreshnessBadge({
  status,
  lastSuccessAt,
}: {
  status: FreshnessStatus;
  lastSuccessAt: string | null;
}) {
  const s = STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-text-dim"
      title={`Source status: ${s.label}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${s.dot} ${
          status === "fresh" ? "" : status === "inactive" ? "" : "animate-pulse"
        }`}
      />
      <span className={s.text}>{s.label}</span>
      {status !== "inactive" && (
        <>
          <span aria-hidden>·</span>
          <time>{relativeTime(lastSuccessAt)}</time>
        </>
      )}
    </span>
  );
}
