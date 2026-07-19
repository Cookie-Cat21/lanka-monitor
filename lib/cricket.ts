import type { CricketData } from "./types";

/**
 * Cricket feed requires CRICKET_API_KEY to be configured.
 * Without it this returns an honest inactive state — the card refuses to guess.
 * Set CRICKET_API_KEY to a valid CricAPI / Sportradar key to enable live scores.
 */
export async function getCricketData(): Promise<CricketData> {
  const apiKey = process.env.CRICKET_API_KEY;

  if (!apiKey) {
    return {
      feed_status: "inactive",
      match: null,
      message: "Cricket feed not configured — set CRICKET_API_KEY to enable live scores.",
    };
  }

  try {
    // CricAPI format: fetch current matches featuring Sri Lanka
    const res = await fetch(
      `https://api.cricapi.com/v1/currentMatches?apikey=${apiKey}&offset=0`,
      { next: { revalidate: 120 } }
    );

    if (!res.ok) {
      return {
        feed_status: "inactive",
        match: null,
        message: `Cricket API returned ${res.status} — feed temporarily unavailable.`,
      };
    }

    const body = (await res.json()) as {
      status: string;
      data?: Array<{
        id: string;
        name: string;
        status: string;
        teams?: string[];
        score?: Array<{ r?: number; w?: number; o?: number; inning: string }>;
        dateTimeGMT?: string;
        matchStarted?: boolean;
        matchEnded?: boolean;
      }>;
    };

    if (body.status !== "success" || !body.data) {
      return {
        feed_status: "inactive",
        match: null,
        message: "Cricket API quota exceeded or unavailable.",
      };
    }

    // Filter for Sri Lanka matches
    const slMatches = body.data.filter((m) =>
      (m.teams ?? []).some(
        (t) =>
          t.toLowerCase().includes("sri lanka") ||
          t.toLowerCase().includes("sl ")
      )
    );

    if (slMatches.length === 0) {
      return {
        feed_status: "inactive",
        match: null,
        message: "No Sri Lanka match in progress or recently completed.",
      };
    }

    const m = slMatches[0];
    const teams = m.teams ?? ["Team A", "Team B"];
    const scoreA =
      m.score?.find((s) => s.inning.startsWith(teams[0]))
        ? `${m.score.find((s) => s.inning.startsWith(teams[0]))?.r ?? 0}/${m.score.find((s) => s.inning.startsWith(teams[0]))?.w ?? 0}`
        : null;
    const scoreB =
      m.score?.find((s) => s.inning.startsWith(teams[1]))
        ? `${m.score.find((s) => s.inning.startsWith(teams[1]))?.r ?? 0}/${m.score.find((s) => s.inning.startsWith(teams[1]))?.w ?? 0}`
        : null;

    return {
      feed_status: m.matchStarted && !m.matchEnded ? "live" : "recent",
      match: {
        id: m.id,
        title: m.name,
        status: m.status,
        team_a: teams[0],
        team_b: teams[1],
        score_a: scoreA,
        score_b: scoreB,
        result: m.matchEnded ? m.status : null,
        starts_at: m.dateTimeGMT ? new Date(m.dateTimeGMT).toISOString() : null,
        is_live: !!(m.matchStarted && !m.matchEnded),
      },
      message: m.status,
    };
  } catch {
    return {
      feed_status: "inactive",
      match: null,
      message: "Cricket feed unreachable — retrying.",
    };
  }
}
