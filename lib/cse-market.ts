export type CseMarketPhase = "open" | "pre_open" | "closed" | "weekend";

const COLOMBO = "Asia/Colombo";

function colomboParts(now: Date) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: COLOMBO,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return {
    weekday: get("weekday"),
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function getCseMarketPhase(now = new Date()): CseMarketPhase {
  const { weekday, minutes } = colomboParts(now);
  if (weekday === "Sat" || weekday === "Sun") return "weekend";

  if (minutes >= 9 * 60 + 30 && minutes < 14 * 60 + 30) return "open";
  if (minutes >= 9 * 60 && minutes < 9 * 60 + 30) return "pre_open";
  return "closed";
}

export function cseMarketLabel(phase: CseMarketPhase): string {
  switch (phase) {
    case "open":
      return "Market open";
    case "pre_open":
      return "Pre-open";
    case "weekend":
      return "Weekend";
    case "closed":
      return "Closed";
  }
}

export function cseMarketHint(phase: CseMarketPhase): string | null {
  const { minutes } = colomboParts(new Date());
  switch (phase) {
    case "open":
      return "Closes 14:30 Colombo";
    case "pre_open":
      return "Opens 9:30 Colombo";
    case "weekend":
      return "Opens Mon 9:30";
    case "closed":
      return minutes < 9 * 60 ? "Opens 9:30 Colombo" : "Last session close";
  }
}
