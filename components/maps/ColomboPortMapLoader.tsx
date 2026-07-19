"use client";

"use client";

import dynamic from "next/dynamic";

const ColomboPortMap = dynamic(() => import("@/components/maps/ColomboPortMap"), {
  ssr: false,
  loading: () => (
    <section
      className="flex h-[min(42vh,320px)] items-center justify-center rounded-xl border border-panel-edge bg-panel sm:h-[min(38vh,360px)]"
      aria-hidden
    >
      <span className="text-xs text-text-dim">Loading map…</span>
    </section>
  ),
});

export default ColomboPortMap;
