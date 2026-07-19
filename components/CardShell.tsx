"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import FreshnessBadge from "@/components/FreshnessBadge";
import type { FreshnessStatus, SourceStatus } from "@/lib/types";

export default function CardShell({
  title,
  subtitle,
  source,
  status,
  lastSuccessAt,
  delay = 0,
  className = "",
  style,
  footer,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  source?: SourceStatus | null;
  status?: FreshnessStatus;
  lastSuccessAt?: string | null;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const resolvedStatus = status ?? source?.status ?? "down";
  const resolvedAt = lastSuccessAt ?? source?.last_success_at ?? null;
  // Never start at opacity 0 — SSR / no-JS / slow hydrate must stay readable.
  const motionProps = reduce
    ? {}
    : {
        initial: { opacity: 1, y: 0 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, delay, ease: "easeOut" as const },
      };

  return (
    <motion.article
      {...motionProps}
      className={`min-h-[160px] rounded-xl border border-panel-edge bg-panel p-4 sm:p-5 ${className}`}
      style={style}
    >
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-zinc-300">{title}</h2>
          {subtitle ? (
            <div className="mt-0.5 text-[11px] text-text-dim">{subtitle}</div>
          ) : null}
        </div>
        <FreshnessBadge status={resolvedStatus} lastSuccessAt={resolvedAt} />
      </header>
      {children}
      {footer ? (
        <footer className="mt-2 text-xs text-text-dim">{footer}</footer>
      ) : null}
    </motion.article>
  );
}
