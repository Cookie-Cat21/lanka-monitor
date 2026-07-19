import { getNextHoliday } from "@/lib/holidays";

export default function HolidayGlance() {
  const next = getNextHoliday();
  if (!next) return null;

  return (
    <aside
      className="mb-3 flex items-center gap-2 rounded-xl border border-panel-edge bg-panel px-3.5 py-2.5 text-xs sm:gap-3 sm:px-4 sm:text-sm"
      aria-label={`Next holiday: ${next.name}, ${next.label}`}
    >
      <span className="shrink-0 text-muted">Next</span>
      <span
        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] ${
          next.kind === "poya"
            ? "bg-accent-soft text-ink"
            : "bg-stale/10 text-stale"
        }`}
      >
        {next.kind === "poya" ? "Poya" : "Public"}
      </span>
      <span className="min-w-0 truncate font-semibold text-ink-soft">
        {next.name}
      </span>
      <time
        dateTime={next.date}
        className="tabular ml-auto shrink-0 text-muted"
      >
        {next.label}
      </time>
    </aside>
  );
}
