"use client";

import { motion } from "framer-motion";
import FreshnessBadge from "@/components/FreshnessBadge";

export default function PlaceholderCard({
  title,
  detail,
  index = 0,
}: {
  title: string;
  detail: string;
  index?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 * (index + 1), ease: "easeOut" }}
      className="rounded-xl border border-dashed border-panel-edge bg-panel/50 p-4 sm:p-5"
    >
      <header className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium text-zinc-400">{title}</h2>
        <FreshnessBadge status="inactive" lastSuccessAt={null} />
      </header>
      <p className="text-xs leading-relaxed text-text-dim">{detail}</p>
    </motion.article>
  );
}
