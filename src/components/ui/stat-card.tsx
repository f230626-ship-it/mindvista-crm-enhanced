import type { LucideIcon } from "lucide-react";
import { KpiStatCard, type KpiTone } from "@/components/ui/kpi-stat-card";

const TONE_ROTATION: KpiTone[] = ["blue", "green", "amber", "violet"];

export function StatCard({
  title,
  value,
  description,
  icon,
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
  const tone = TONE_ROTATION[(delay / 60) % TONE_ROTATION.length];

  return (
    <KpiStatCard
      label={title}
      value={value}
      description={description}
      icon={icon}
      tone={tone}
      delay={delay}
      className={className}
    />
  );
}
