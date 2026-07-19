import type { FreshnessStatus } from "@/lib/types";
import RelativeTime from "@/components/RelativeTime";

const STYLES: Record<
  FreshnessStatus,
  { dot: string; label: string; text: string; pill: string }
> = {
  fresh: {
    dot: "bg-fresh",
    label: "fresh",
    text: "text-fresh",
    pill: "bg-fresh/10",
  },
  stale: {
    dot: "bg-stale",
    label: "stale",
    text: "text-stale",
    pill: "bg-stale/10",
  },
  down: {
    dot: "bg-down",
    label: "down",
    text: "text-down",
    pill: "bg-down/10",
  },
  inactive: {
    dot: "bg-muted",
    label: "soon",
    text: "text-muted",
    pill: "bg-accent-soft",
  },
};

export default function FreshnessBadge({
  status,
  lastSuccessAt,
}: {
  status: FreshnessStatus;
  lastSuccessAt: string | null;
}) {
  const s = STYLES[status];
  const aria =
    status === "inactive"
      ? "Source coming soon"
      : `Source ${s.label}${lastSuccessAt ? `, last success ${lastSuccessAt}` : ", no data yet"}`;

  return (
    <span
      role="status"
      aria-label={aria}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ${s.pill}`}
      title={`Source status: ${s.label}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${s.dot} ${
          status === "down" ? "animate-pulse" : ""
        }`}
        aria-hidden
      />
      <span className={s.text}>{s.label}</span>
      {status !== "inactive" && (
        <>
          <span className="text-muted/60" aria-hidden>
            ·
          </span>
          <span className="font-normal text-muted">
            <RelativeTime iso={lastSuccessAt} />
          </span>
        </>
      )}
    </span>
  );
}
