"use client";

import { useEffect } from "react";
import { trackVisit } from "@/lib/analytics";

/**
 * Drop this anywhere in a client tree to fire D1/D7 analytics pings.
 * Fires once on mount; no re-fires on re-renders.
 */
export default function AnalyticsBeacon({ path = "/" }: { path?: string }) {
  useEffect(() => {
    trackVisit(path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
