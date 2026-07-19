/**
 * Lightweight client-side analytics stub.
 * Fires D1 (first-visit) and D7 (7-day retention) pings to the configured
 * NEXT_PUBLIC_ANALYTICS_URL endpoint, or to /api/analytics if unset.
 *
 * This is intentionally minimal — no third-party scripts, no cookies.
 * Data sent: event name, page path, anonymised session key (tab-scoped UUID).
 */

const STORAGE_KEY = "lm_analytics";
const SESSION_KEY = "lm_session_id";

interface StoredData {
  first_visit: string;
  last_ping_d7: string | null;
}

function getSessionId(): string {
  if (typeof sessionStorage === "undefined") return "ssr";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function getStored(): StoredData | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredData) : null;
  } catch {
    return null;
  }
}

function setStored(data: StoredData): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota exceeded — skip */
  }
}

async function ping(event: string, path: string): Promise<void> {
  const endpoint =
    process.env.NEXT_PUBLIC_ANALYTICS_URL ?? "/api/analytics";
  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        path,
        session_id: getSessionId(),
        ts: new Date().toISOString(),
      }),
      keepalive: true,
    });
  } catch {
    /* non-fatal */
  }
}

/** Call once per page mount to fire D1 / D7 analytics pings. */
export function trackVisit(path = "/"): void {
  if (typeof window === "undefined") return;

  const now = new Date().toISOString();
  const stored = getStored();

  if (!stored) {
    setStored({ first_visit: now, last_ping_d7: null });
    void ping("d1_visit", path);
    return;
  }

  const firstMs = new Date(stored.first_visit).getTime();
  const lastD7Ms = stored.last_ping_d7
    ? new Date(stored.last_ping_d7).getTime()
    : null;
  const nowMs = Date.now();

  // Fire D7 ping once per calendar day after 7 days from first visit
  if (nowMs - firstMs >= 7 * 86_400_000) {
    if (!lastD7Ms || nowMs - lastD7Ms >= 86_400_000) {
      setStored({ ...stored, last_ping_d7: now });
      void ping("d7_retention", path);
    }
  }
}
