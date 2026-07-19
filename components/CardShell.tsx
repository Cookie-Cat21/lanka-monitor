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
      whileHover={reduce ? undefined : { y: -1 }}
      transition={{ duration: 0.15, delay }}
      className={`relative min-h-[160px] overflow-hidden rounded-xl border border-panel-edge bg-panel p-4 sm:p-5 ${className}`}
      style={style}
    >
      <span
        aria-hidden
        className={`absolute inset-y-3 left-0 w-[3px] rounded-full ${STATUS_RAIL[resolvedStatus]}`}
      />
      <header className="mb-3 flex items-start justify-between gap-2 pl-2.5">
        <div className="min-w-0">
          <h2 className="font-display text-sm font-semibold tracking-tight text-ink">
            {title}
          </h2>
          {subtitle ? (
            <div className="mt-0.5 text-[11px] text-muted">{subtitle}</div>
          ) : null}
        </div>
        <FreshnessBadge status={resolvedStatus} lastSuccessAt={resolvedAt} />
      </header>
      <div className="pl-2.5">{children}</div>
      {footer ? (
        <footer className="mt-3 border-t border-panel-edge pt-2 pl-2.5 text-[11px] leading-relaxed text-muted">
          {footer}
        </footer>
      ) : null}
    </motion.article>
  );
}
