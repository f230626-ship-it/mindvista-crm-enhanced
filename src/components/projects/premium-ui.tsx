"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  formatter?: (n: number) => string;
}

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  duration = 900,
  className,
  formatter,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame: number;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  const formatted = formatter ? formatter(display) : display.toLocaleString();

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  showLabel?: boolean;
}

export function CircularProgress({
  value,
  size = 56,
  strokeWidth = 4,
  className,
  trackClassName,
  showLabel = true,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="pm-circular-progress">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={cn("text-muted/60", trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#pmProgressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="pmProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d4893a" />
            <stop offset="50%" stopColor="#e5a158" />
            <stop offset="100%" stopColor="#f0c078" />
          </linearGradient>
        </defs>
      </svg>
      {showLabel && (
        <span className="absolute text-[11px] font-black font-mono text-foreground">
          {clamped}%
        </span>
      )}
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  description: string;
  icon: React.ReactNode;
  accentClass?: string;
  borderClass?: string;
  staggerClass?: string;
  valueClassName?: string;
  onClick?: () => void;
  active?: boolean;
}

export function KpiCard({
  label,
  value,
  description,
  icon,
  accentClass = "text-primary",
  borderClass = "border-l-primary/80",
  staggerClass = "",
  valueClassName = "",
  onClick,
  active,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "pm-kpi border-l-4 p-4 transition-all",
        borderClass,
        staggerClass,
        onClick && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
        active && "ring-2 ring-primary/40 shadow-md"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between pb-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
        <div className={cn("pm-kpi-icon", accentClass)}>{icon}</div>
      </div>
      <div className={cn("text-2xl font-black tracking-tight", valueClassName)}>{value}</div>
      <p className="text-[10px] text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
