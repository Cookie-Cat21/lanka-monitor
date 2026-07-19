"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import FreshnessBadge from "@/components/FreshnessBadge";
import type { FreshnessStatus, SourceStatus } from "@/lib/types";

const STATUS_RAIL: Record<FreshnessStatus, string> = {
  fresh: "bg-fresh",
  stale: "bg-stale",
  down: "bg-down",
  inactive: "bg-panel-edge",
};

/** Tremor/HyperUI-inspired KPI panel — status rail + clear hierarchy. */
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

  return (
    <motion.article
      initial={false}
      whileHover={reduce ? undefined : { y: -2 }}
      transition={{ duration: 0.2, delay }}
      className={`group relative min-h-[160px] overflow-hidden rounded-2xl border border-panel-edge bg-panel p-4 shadow-[0_1px_0_rgba(12,31,36,0.04)] sm:p-5 ${className}`}
      style={style}
    >
      <span
        aria-hidden
        className={`absolute inset-y-3 left-0 w-[3px] rounded-full ${STATUS_RAIL[resolvedStatus]}`}
      />
      <header className="mb-3 flex items-start justify-between gap-2 pl-2">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold tracking-tight text-ink-soft">
            {title}
          </h2>
          {subtitle ? (
            <div className="mt-0.5 text-[11px] text-muted">{subtitle}</div>
          ) : null}
        </div>
        <FreshnessBadge status={resolvedStatus} lastSuccessAt={resolvedAt} />
      </header>
      <div className="pl-2">{children}</div>
      {footer ? (
        <footer className="mt-3 border-t border-panel-edge/70 pt-2 pl-2 text-[11px] leading-relaxed text-muted">
          {footer}
        </footer>
      ) : null}
    </motion.article>
  );
}
