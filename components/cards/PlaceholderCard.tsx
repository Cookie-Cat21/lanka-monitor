"use client";

import {
  Activity,
  CloudRain,
  Fuel,
  Newspaper,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import CardShell from "@/components/CardShell";

const ICONS: Record<string, LucideIcon> = {
  Weather: CloudRain,
  "Power cuts": Zap,
  Power: Zap,
  Fuel: Fuel,
  Health: Activity,
  "News pulse": Newspaper,
  Cricket: Trophy,
};

export default function PlaceholderCard({
  title,
  detail,
  index = 0,
}: {
  title: string;
  detail: string;
  index?: number;
}) {
  const Icon = ICONS[title];

  return (
    <CardShell
      title={title}
      status="inactive"
      lastSuccessAt={null}
      delay={0.05 * (index + 1)}
      className="min-h-[120px] border-dashed bg-panel/50"
    >
      <div className="flex gap-3">
        {Icon ? (
          <Icon
            className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600"
            strokeWidth={1.75}
            aria-hidden
          />
        ) : null}
        <p className="text-xs leading-relaxed text-text-dim">{detail}</p>
      </div>
    </CardShell>
  );
}
