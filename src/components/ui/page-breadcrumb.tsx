import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";

interface BreadcrumbSegment {
  label: string;
  href: string;
}

interface PageBreadcrumbProps {
  /** The parent page(s) to link back to. First item is the primary back target. */
  segments: BreadcrumbSegment[];
  /** The current page label (shown as non-clickable text). */
  current: string;
}

/**
 * Consistent breadcrumb / back-button used across all detail & sub-pages.
 *
 * Usage:
 * ```tsx
 * <PageBreadcrumb
 *   segments={[{ label: "Employees", href: "/admin/employees" }]}
 *   current="John Doe"
 * />
 * ```
 */
export function PageBreadcrumb({ segments, current }: PageBreadcrumbProps) {
  const primary = segments[0];

  return (
    <nav className="flex items-center gap-2 mb-5" aria-label="Breadcrumb">
      {/* Primary back button */}
      <Link
        href={primary.href}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground bg-muted/50 hover:bg-muted hover:text-foreground border border-border/40 hover:border-border/70 transition-all duration-150 group"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
        {primary.label}
      </Link>

      {/* Additional middle segments */}
      {segments.slice(1).map((seg) => (
        <span key={seg.href} className="contents">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
          <Link
            href={seg.href}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate"
          >
            {seg.label}
          </Link>
        </span>
      ))}

      {/* Current page */}
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
      <span className="text-sm font-semibold text-foreground truncate">
        {current}
      </span>
    </nav>
  );
}
