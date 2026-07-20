"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricItem {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  color: string;
}

// Semantic accent color per metric type — precise, intentional, no generic muted grey
const COLOR_MAP: Record<string, { base: string; hover: string }> = {
  primary: { base: "text-[#e5a158]",  hover: "group-hover:text-[#e5a158]" },
  blue:    { base: "text-[#3b82f6]",  hover: "group-hover:text-[#3b82f6]" },
  amber:   { base: "text-[#f59e0b]",  hover: "group-hover:text-[#f59e0b]" },
  green:   { base: "text-[#10b981]",  hover: "group-hover:text-[#10b981]" },
  violet:  { base: "text-[#8b5cf6]",  hover: "group-hover:text-[#8b5cf6]" },
};

export function MetricStrip({
  metrics,
  activeFilter,
  onFilterChange,
}: {
  metrics: MetricItem[];
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}) {
  const filterMap: Record<number, string | null> = {
    0: null,
    1: "active",
    2: "on_hold",
    3: "completed",
    4: "retainers",
    5: null,
  };

  return (
    <div className="grid gap-px rounded-xl border border-border/50 bg-border/30 p-px overflow-hidden grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {metrics.map((m, i) => {
        const Icon = m.icon;
        const filter = filterMap[i];
        const isActive = activeFilter === filter;
        const colors = COLOR_MAP[m.color] ?? COLOR_MAP.primary;

        return (
          <button
            key={m.label}
            onClick={() => onFilterChange(filter)}
            className={cn(
              "group relative flex items-center gap-2.5 sm:gap-3.5 px-3 sm:px-5 py-3 sm:py-3.5 transition-all duration-150 min-w-0",
              isActive ? "bg-primary/[0.05]" : "bg-card hover:bg-muted/30",
            )}
          >
            {/* Active state: thin left-border indicator (Linear / Vercel style) */}
            {isActive && (
              <span className="absolute inset-y-2 left-0 w-[2px] rounded-r-full bg-[#e5a158]" />
            )}

            {/* Icon — no boxy container, just the icon with semantic color */}
            <Icon
              className={cn(
                "h-4 w-4 sm:h-[17px] sm:w-[17px] shrink-0 transition-colors duration-150",
                isActive
                  ? colors.base
                  : cn("text-muted-foreground/50", colors.hover)
              )}
              strokeWidth={1.65}
            />

            {/* Text */}
            <div className="min-w-0 text-left">
              <p
                className={cn(
                  "text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.08em] leading-none mb-1 sm:mb-1.5 transition-colors",
                  isActive ? "text-primary/70" : "text-muted-foreground/60"
                )}
              >
                {m.label}
              </p>
              <p
                className={cn(
                  "text-[15px] sm:text-[19px] font-bold tracking-tight leading-none tabular-nums transition-colors",
                  isActive ? colors.base : "text-foreground"
                )}
              >
                {m.value}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
