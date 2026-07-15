"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricItem {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  color: string;
}

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
    <div className="flex flex-wrap items-stretch gap-px rounded-xl border border-border/50 bg-border/30 p-px">
      {metrics.map((m, i) => {
        const Icon = m.icon;
        const filter = filterMap[i];
        const isActive = activeFilter === filter;

        return (
          <button
            key={m.label}
            onClick={() => onFilterChange(filter)}
            className={cn(
              "group flex flex-1 items-center gap-3 px-4 py-3 transition-all duration-150",
              "first:rounded-l-xl last:rounded-r-xl",
              isActive
                ? "bg-primary/[0.06]"
                : "bg-card hover:bg-muted/40",
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-150",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "bg-muted/60 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 text-left">
              <p
                className={cn(
                  "text-[11px] font-medium uppercase tracking-[0.06em] transition-colors",
                  isActive ? "text-primary/80" : "text-muted-foreground"
                )}
              >
                {m.label}
              </p>
              <p
                className={cn(
                  "text-xl font-bold tracking-tight leading-tight tabular-nums",
                  isActive ? "text-primary" : "text-foreground"
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
