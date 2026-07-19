"use client";

import { ExternalLink, Newspaper } from "lucide-react";
import CardShell from "@/components/CardShell";
import RelativeTime from "@/components/RelativeTime";
import type { NewsData } from "@/lib/types";

export default function NewsPulseCard({ news }: { news: NewsData }) {
  const hasArticles = news.articles.length > 0;
  const displayArticles = news.articles.slice(0, 8);

  return (
    <CardShell
      title="News pulse"
      subtitle="Sri Lankan outlets"
      status={hasArticles ? "fresh" : "down"}
      lastSuccessAt={displayArticles[0]?.published_at ?? null}
    >
      {hasArticles ? (
        <ul className="space-y-2.5">
          {displayArticles.map((article, i) => (
            <li key={article.id ?? i} className="flex items-start gap-2 min-w-0">
              <span
                className="mt-1 h-1 w-1 shrink-0 rounded-full bg-zinc-600"
                aria-hidden
              />
              <div className="min-w-0">
                {article.url ? (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-1 text-sm leading-snug text-zinc-300 hover:text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
                  >
                    <span className="min-w-0 line-clamp-2">{article.title}</span>
                    <ExternalLink
                      className="mt-0.5 h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60"
                      aria-hidden
                    />
                  </a>
                ) : (
                  <p className="text-sm leading-snug text-zinc-300 line-clamp-2">
                    {article.title}
                  </p>
                )}
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-text-dim">
                  {article.source && (
                    <>
                      <span>{article.source}</span>
                      {article.published_at && <span aria-hidden>·</span>}
                    </>
                  )}
                  {article.published_at && (
                    <RelativeTime iso={article.published_at} />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex gap-3 py-4">
          <Newspaper
            className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600"
            strokeWidth={1.75}
            aria-hidden
          />
          <p className="text-sm text-text-dim">
            No articles ingested yet. The news feed is not yet configured — this
            card refuses to guess.
          </p>
        </div>
      )}
    </CardShell>
  );
}
