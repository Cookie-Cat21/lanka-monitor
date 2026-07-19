"use client";

import { useEffect, useState } from "react";

function formatRelative(iso: string, now: number): string {
  const mins = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Absolute fallback safe for SSR; upgrades to relative after mount. */
export default function RelativeTime({
  iso,
  fallback = "no data yet",
}: {
  iso: string | null;
  fallback?: string;
}) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!iso) return;
    const tick = () => setLabel(formatRelative(iso, Date.now()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [iso]);

  if (!iso) return <time>{fallback}</time>;

  return (
    <time dateTime={iso} title={iso}>
      {label ?? iso.slice(0, 16).replace("T", " ")}
    </time>
  );
}
