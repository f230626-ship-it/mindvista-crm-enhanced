import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const colorSchemes = {
  0: { bg: "bg-blue-50 dark:bg-transparent", border: "border-blue-100 dark:border-border", text: "text-blue-900 dark:text-foreground", icon: "text-blue-600 dark:text-primary" },
  1: { bg: "bg-green-50 dark:bg-transparent", border: "border-green-100 dark:border-border", text: "text-green-900 dark:text-foreground", icon: "text-green-600 dark:text-primary" },
  2: { bg: "bg-orange-50 dark:bg-transparent", border: "border-orange-100 dark:border-border", text: "text-orange-900 dark:text-foreground", icon: "text-orange-600 dark:text-primary" },
  3: { bg: "bg-purple-50 dark:bg-transparent", border: "border-purple-100 dark:border-border", text: "text-purple-900 dark:text-foreground", icon: "text-purple-600 dark:text-primary" },
} as const;

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  className,
  delay = 0,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  className?: string;
  delay?: number;
}) {
  const colorIndex = (delay / 60) % 4 as keyof typeof colorSchemes;
  const colors = colorSchemes[colorIndex];
  
  return (
    <Card
      className={cn(
        "card-hover border-border/60 bg-card/80 opacity-0 animate-slide-up backdrop-blur-sm overflow-hidden pt-0",
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <CardHeader className={cn("flex flex-row items-center justify-between border-b py-(--card-spacing)", colors.bg, colors.border)}>
        <CardTitle className={cn("text-sm font-medium", colors.text)}>{title}</CardTitle>
        <div className="flex items-center justify-center">
          <Icon className={cn("h-5 w-5", colors.icon)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl font-bold tracking-tight">{value}</div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
