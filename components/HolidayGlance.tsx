import { getNextHoliday } from "@/lib/holidays";

export default function HolidayGlance() {
  const next = getNextHoliday();
  if (!next) return null;

  return (
    <aside
      className="mb-4 flex items-center gap-2 rounded-lg border border-panel-edge/50 bg-panel/30 px-3 py-2 text-xs sm:gap-3 sm:px-4 sm:text-sm"
      aria-label={`Next holiday: ${next.name}, ${next.label}`}
    >
      <span className="shrink-0 text-text-dim">Next</span>
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide sm:text-[11px] ${
          next.kind === "poya"
            ? "bg-indigo-500/15 text-indigo-300"
            : "bg-amber-500/10 text-amber-200/90"
        }`}
      >
        {next.kind === "poya" ? "Poya" : "Public"}
      </span>
      <span className="min-w-0 truncate font-medium text-zinc-300">{next.name}</span>
      <time
        dateTime={next.date}
        className="tabular ml-auto shrink-0 text-text-dim"
      >
        {next.label}
      </time>
    </aside>
  );
}
