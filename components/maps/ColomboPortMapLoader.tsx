"use client";

import dynamic from "next/dynamic";

const ColomboPortMap = dynamic(() => import("@/components/maps/ColomboPortMap"), {
  ssr: false,
  loading: () => (
    <section
      className="mb-4 flex h-[min(42vh,280px)] items-center justify-center rounded-xl border border-dashed border-panel-edge bg-panel/40 sm:h-[min(38vh,300px)]"
      aria-hidden
    >
      <span className="text-xs text-text-dim">Loading port map…</span>
    </section>
  ),
});

export default ColomboPortMap;
