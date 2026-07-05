import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricGlowCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  accent = "primary",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  className?: string;
  accent?: "primary" | "emerald" | "blue" | "violet";
}) {
  const accents = {
    primary: "from-primary/20 to-primary/5 border-primary/25 shadow-primary/10",
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/25 shadow-emerald-500/10",
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/25 shadow-blue-500/10",
    violet: "from-violet-500/20 to-violet-500/5 border-violet-500/25 shadow-violet-500/10",
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden border bg-gradient-to-br shadow-lg backdrop-blur-sm transition-transform hover:-translate-y-0.5",
        accents[accent],
        className
      )}
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
            {trend && <p className="mt-2 text-xs font-medium text-primary">{trend}</p>}
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background/50 ring-1 ring-white/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
