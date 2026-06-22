import { cn } from "@/lib/utils";

export function Spinner({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-[3px]",
  }[size];

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-primary/30 border-t-primary",
        sizeClass,
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}
