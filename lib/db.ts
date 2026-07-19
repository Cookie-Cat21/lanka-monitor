// Thin PostgREST read helper. The dashboard only ever reads via the anon key;
// all writes happen in the Python ingest workers with the service-role key.
// Returns null when Supabase isn't configured or the request fails, so the UI
// can degrade to an explicit "no data" state instead of crashing.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function dbConfigured(): boolean {
  return Boolean(url && anonKey);
}

export async function rest<T>(
  path: string,
  revalidateSeconds = 300
): Promise<T | null> {
  if (!url || !anonKey) return null;
  try {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      next: { revalidate: revalidateSeconds },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
