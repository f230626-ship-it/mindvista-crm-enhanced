import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HierarchyNode } from "@/lib/hierarchy";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function OrgNodeCard({
  node,
  depth,
  isCurrentUser,
  hasChildren,
  expanded,
  descendantCount,
  onToggleExpand,
  onSelect,
}: {
  node: HierarchyNode;
  depth: number;
  isCurrentUser: boolean;
  hasChildren: boolean;
  expanded: boolean;
  descendantCount: number;
  onToggleExpand: () => void;
  onSelect: () => void;
}) {
  const initials = getInitials(node.full_name);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "group relative flex flex-col items-center gap-1 sm:gap-1.5 rounded-xl border bg-card px-2.5 sm:px-4 py-2 sm:py-3 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
          "min-w-[100px] max-w-[120px] sm:min-w-[144px] sm:max-w-[188px] md:min-w-[164px] md:max-w-[204px]",
          isCurrentUser
            ? "border-primary/50 ring-2 ring-primary/30"
            : "border-border/60 hover:border-primary/40"
        )}
      >
        <Avatar
          className={cn(
            "ring-2 ring-border/60 transition-all group-hover:ring-primary/40",
            depth === 0 ? "h-10 w-10 sm:h-12 sm:w-12" : "h-8 w-8 sm:h-10 sm:w-10"
          )}
        >
          <AvatarImage src={node.profile_photo_url ?? undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary/25 to-primary/10 font-semibold text-primary text-xs sm:text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="w-full min-w-0">
          <p
            className={cn(
              "truncate leading-tight",
              depth === 0
                ? "text-xs sm:text-base font-bold"
                : depth === 1
                  ? "text-[11px] sm:text-sm font-semibold"
                  : "text-[11px] sm:text-sm font-medium text-foreground/90"
            )}
          >
            {node.full_name}
          </p>
          {node.designation && (
            <p className="mt-0.5 truncate text-[9px] sm:text-[11px] leading-tight text-muted-foreground">
              {node.designation}
            </p>
          )}
          {node.employee_code && (
            <p className="mt-0.5 font-mono text-[8px] sm:text-[10px] text-muted-foreground/70">
              #{node.employee_code}
            </p>
          )}
          {node.role !== "admin" && (node.managerName || node.leadName) && (
            <div className="mt-1.5 sm:mt-2.5 w-full space-y-1 sm:space-y-1.5 border-t border-border/50 pt-1.5 sm:pt-2 text-left">
              <p className="truncate text-[10px] sm:text-xs leading-snug">
                <span className="font-medium text-primary/80">Reports to </span>
                <span className="font-semibold text-foreground">{node.managerName ?? "—"}</span>
              </p>
              <p className="truncate text-[10px] sm:text-xs leading-snug">
                <span className="font-medium text-primary/80">Lead </span>
                <span className="font-semibold text-foreground">{node.leadName ?? "—"}</span>
              </p>
            </div>
          )}
        </div>

        {node.relationship === "You" && (
          <Badge
            variant="outline"
            className="mt-0.5 gap-1 border-primary/30 bg-primary/10 px-1 py-0 text-[9px] sm:text-[10px] text-primary"
          >
            <Crown className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
            You
          </Badge>
        )}
      </button>

      {hasChildren && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          aria-label={expanded ? "Collapse team" : "Expand team"}
          className="absolute -bottom-2.5 sm:-bottom-3 left-1/2 z-10 flex h-5 sm:h-6 min-w-5 sm:min-w-6 -translate-x-1/2 items-center justify-center gap-0.5 rounded-full border border-border/60 bg-background px-0.5 sm:px-1 text-[9px] sm:text-[10px] font-medium text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
        >
          {expanded ? (
            <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          ) : (
            <>
              <ChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span>{descendantCount}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
