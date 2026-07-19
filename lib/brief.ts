import { rest } from "./db";
import type { BriefCitation, BriefData, BriefLocale } from "./types";

// Matches the actual `briefs` table schema:
//   id, brief_date, content (EN body), model, meta (JSONB), created_at
// The meta JSONB carries:
//   { locales: { si, ta }, citations: [{n, title, url}], headline,
//     is_fallback, generated_at }
interface BriefRow {
  id: number;
  brief_date: string;
  content: string;
  model: string | null;
  meta: {
    locales?: { si?: string; ta?: string } | null;
    citations?: BriefCitation[] | null;
    headline?: string | null;
    is_fallback?: boolean | null;
    generated_at?: string | null;
  } | null;
  created_at: string;
}

function parseCitations(raw: unknown): BriefCitation[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter(
      (c): c is BriefCitation =>
        typeof c === "object" && c !== null && "n" in c && "title" in c
    );
  }
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      return parseCitations(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

export async function getBriefData(): Promise<BriefData> {
  const rows = await rest<BriefRow[]>(
    "briefs?select=id,brief_date,content,model,meta,created_at" +
      "&order=brief_date.desc&limit=1",
    120
  );

  if (!rows || rows.length === 0) {
    return {
      id: null,
      brief_date: null,
      en: null,
      si: null,
      ta: null,
      headline: null,
      citations: [],
      is_fallback: false,
      model: null,
      created_at: null,
      locale_available: [],
    };
  }

  const row = rows[0];
  const meta = row.meta ?? {};
  const si = meta.locales?.si ?? null;
  const ta = meta.locales?.ta ?? null;
  const en = row.content ?? null;

  const locales: BriefLocale[] = [];
  if (en) locales.push("en");
  if (si) locales.push("si");
  if (ta) locales.push("ta");

  return {
    id: String(row.id),
    brief_date: row.brief_date,
    en,
    si: si || null,
    ta: ta || null,
    headline: meta.headline ?? null,
    citations: parseCitations(meta.citations),
    is_fallback: meta.is_fallback ?? false,
    model: row.model ?? null,
    created_at: row.created_at,
    locale_available: locales,
  };
}
