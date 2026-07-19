"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type SituationMapType from "./SituationMap";

const SituationMap = dynamic(() => import("@/components/maps/SituationMap"), {
  ssr: false,
  loading: () => (
    <section
      className="flex h-[min(52vh,380px)] items-center justify-center rounded-xl border border-panel-edge bg-lagoon-soft/40 sm:h-[min(48vh,420px)]"
      aria-label="Situation map loading"
      aria-hidden
    >
      <span className="text-xs text-muted">Loading map…</span>
    </section>
  ),
});

export default function SituationMapLoader(
  props: ComponentProps<typeof SituationMapType>
) {
  return <SituationMap {...props} />;
}
