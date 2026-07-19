export type HolidayKind = "poya" | "public";

export interface Holiday {
  date: string;
  name: string;
  kind: HolidayKind;
}

/** Official 2026 gazette calendar — Poya + public holidays. */
export const HOLIDAYS_2026: Holiday[] = [
  { date: "2026-01-03", name: "Duruthu Poya", kind: "poya" },
  { date: "2026-01-15", name: "Tamil Thai Pongal", kind: "public" },
  { date: "2026-02-01", name: "Nawam Poya", kind: "poya" },
  { date: "2026-02-04", name: "Independence Day", kind: "public" },
  { date: "2026-02-15", name: "Maha Sivarathri", kind: "public" },
  { date: "2026-03-02", name: "Medin Poya", kind: "poya" },
  { date: "2026-03-21", name: "Id-Ul-Fitr", kind: "public" },
  { date: "2026-04-01", name: "Bak Poya", kind: "poya" },
  { date: "2026-04-03", name: "Good Friday", kind: "public" },
  { date: "2026-04-13", name: "New Year Eve", kind: "public" },
  { date: "2026-04-14", name: "Sinhala & Tamil New Year", kind: "public" },
  { date: "2026-05-01", name: "Vesak Poya · May Day", kind: "poya" },
  { date: "2026-05-02", name: "Day after Vesak", kind: "poya" },
  { date: "2026-05-28", name: "Id-Ul-Alha", kind: "public" },
  { date: "2026-05-30", name: "Adhi Poson Poya", kind: "poya" },
  { date: "2026-06-29", name: "Poson Poya", kind: "poya" },
  { date: "2026-07-29", name: "Esala Poya", kind: "poya" },
  { date: "2026-08-26", name: "Milad-Un-Nabi", kind: "public" },
  { date: "2026-08-27", name: "Nikini Poya", kind: "poya" },
  { date: "2026-09-26", name: "Binara Poya", kind: "poya" },
  { date: "2026-10-25", name: "Vap Poya", kind: "poya" },
  { date: "2026-11-08", name: "Deepavali", kind: "public" },
  { date: "2026-11-24", name: "Il Poya", kind: "poya" },
  { date: "2026-12-23", name: "Unduvap Poya", kind: "poya" },
  { date: "2026-12-25", name: "Christmas", kind: "public" },
];

const colomboDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Colombo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format;

const compactDate = new Intl.DateTimeFormat("en-LK", {
  timeZone: "Asia/Colombo",
  weekday: "short",
  day: "numeric",
  month: "short",
}).format;

export function getNextHoliday(
  holidays: Holiday[] = HOLIDAYS_2026,
  now = new Date(),
): (Holiday & { label: string }) | null {
  const today = colomboDay(now);
  const next = holidays.find((h) => h.date >= today);
  if (!next) return null;

  return {
    ...next,
    label: compactDate(new Date(`${next.date}T12:00:00+05:30`)),
  };
}
