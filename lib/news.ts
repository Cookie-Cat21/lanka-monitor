import { rest } from "./db";
import type { NewsArticle, NewsCluster, NewsData } from "./types";

interface ArticleRow {
  id?: string;
  title: string;
  source: string | null;
  url: string | null;
  published_at: string | null;
  cluster?: string | null;
}

function clusterArticles(articles: NewsArticle[]): NewsCluster[] {
  if (articles.length === 0) return [];

  // Group articles with identical or near-identical cluster tags first
  const tagged = new Map<string, NewsArticle[]>();
  const untagged: NewsArticle[] = [];

  for (const a of articles) {
    if (a.cluster) {
      const group = tagged.get(a.cluster) ?? [];
      group.push(a);
      tagged.set(a.cluster, group);
    } else {
      untagged.push(a);
    }
  }

  const clusters: NewsCluster[] = [...tagged.entries()].map(([label, arts]) => ({
    label,
    articles: arts,
  }));

  // If no cluster tags, expose last 8 articles as one flat "Latest" cluster
  if (clusters.length === 0 && untagged.length > 0) {
    clusters.push({ label: "Latest", articles: untagged.slice(0, 8) });
  } else if (untagged.length > 0) {
    // Append untagged as an "Other" bucket if small enough
    clusters.push({ label: "Other", articles: untagged.slice(0, 4) });
  }

  return clusters;
}

export async function getNewsData(): Promise<NewsData> {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const rows = await rest<ArticleRow[]>(
    `articles?select=id,title,source,url,published_at,cluster` +
      `&published_at=gte.${since}&order=published_at.desc&limit=20`,
    120
  );

  if (!rows || rows.length === 0) {
    // Try without date filter — some ingests may batch weekly
    const fallback = await rest<ArticleRow[]>(
      `articles?select=id,title,source,url,published_at,cluster` +
        `&order=published_at.desc&limit=8`,
      120
    );
    if (!fallback || fallback.length === 0) return { articles: [], clusters: [] };
    const articles = fallback.map<NewsArticle>((r) => ({
      id: r.id,
      title: r.title,
      source: r.source,
      url: r.url,
      published_at: r.published_at,
      cluster: r.cluster,
    }));
    return { articles, clusters: clusterArticles(articles) };
  }

  const articles = rows.map<NewsArticle>((r) => ({
    id: r.id,
    title: r.title,
    source: r.source,
    url: r.url,
    published_at: r.published_at,
    cluster: r.cluster,
  }));

  return { articles, clusters: clusterArticles(articles) };
}
