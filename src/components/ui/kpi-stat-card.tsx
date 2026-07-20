import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type KpiTone = "primary" | "blue" | "amber" | "green" | "violet";

const TONE_STYLES: Record<
  KpiTone,
  { iconColor: string; headerBg: string; headerTextColor: string; borderColor: string }
> = {
  primary: {
    iconColor: "text-[#e5a158]",
    headerBg: "bg-orange-50 dark:bg-transparent",
    headerTextColor: "text-orange-900 dark:text-foreground",
    borderColor: "border-orange-100 dark:border-border",
  },
  blue: {
    iconColor: "text-[#3b82f6]",
    headerBg: "bg-blue-50 dark:bg-transparent",
    headerTextColor: "text-blue-900 dark:text-foreground",
    borderColor: "border-blue-100 dark:border-border",
  },
  amber: {
    iconColor: "text-[#f59e0b]",
    headerBg: "bg-amber-50 dark:bg-transparent",
    headerTextColor: "text-amber-900 dark:text-foreground",
    borderColor: "border-amber-100 dark:border-border",
  },
  green: {
    iconColor: "text-[#10b981]",
    headerBg: "bg-green-50 dark:bg-transparent",
    headerTextColor: "text-green-900 dark:text-foreground",
    borderColor: "border-green-100 dark:border-border",
  },
  violet: {
    iconColor: "text-[#8b5cf6]",
    headerBg: "bg-violet-50 dark:bg-transparent",
    headerTextColor: "text-violet-900 dark:text-foreground",
    borderColor: "border-violet-100 dark:border-border",
  },
};

export function KpiStatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "primary",
  delay = 0,
  active,
  onClick,
  className,
}: {
  label: string;
  value: React.ReactNode;
  description?: string;
  icon: LucideIcon;
  tone?: KpiTone;
  delay?: number;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const t = TONE_STYLES[tone];

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-xl border border-border/60 bg-card overflow-hidden opacity-0 animate-slide-up transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
        onClick && "cursor-pointer",
        active && "border-primary/50 ring-1 ring-primary/30",
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      {/* Colored header section */}
      <div className={cn("flex items-center justify-between px-5 py-4 border-b", t.headerBg, t.borderColor)}>
        <span className={cn("text-[11px] font-semibold uppercase tracking-wider", t.headerTextColor)}>
          {label}
        </span>
        <Icon 
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-all duration-200",
            t.iconColor,
            "opacity-75 group-hover:opacity-100 group-hover:scale-105"
          )} 
          strokeWidth={1.5}
        />
      </div>
      
      <div className="p-5">
        <div className="text-3xl font-bold tracking-tight text-foreground">{value}</div>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
