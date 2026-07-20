import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Building2, CalendarDays, Hash, UserCheck, Crown } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import type { HierarchyNode } from "@/lib/hierarchy";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function DetailRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className={mono ? "truncate font-mono text-sm" : "truncate text-sm font-medium"}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function OrgNodeDetailSheet({
  node,
  open,
  onOpenChange,
}: {
  node: HierarchyNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        {node && (
          <>
            <SheetHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 ring-2 ring-border/60">
                  <AvatarImage src={node.profile_photo_url ?? undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/25 to-primary/10 text-lg font-semibold text-primary">
                    {getInitials(node.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <SheetTitle className="truncate text-base">{node.full_name}</SheetTitle>
                  <SheetDescription className="truncate">
                    {node.designation}
                  </SheetDescription>
                  <Badge variant="outline" className="mt-1.5 text-[10px]">
                    {node.relationship}
                  </Badge>
                </div>
              </div>
            </SheetHeader>

            <div className="divide-y divide-border/50 px-4">
              {node.employee_code && (
                <DetailRow
                  icon={<Hash className="h-4 w-4" />}
                  label="Employee Code"
                  value={`#${node.employee_code}`}
                  mono
                />
              )}
              {node.email && (
                <DetailRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                  value={
                    <a href={`mailto:${node.email}`} className="hover:text-primary hover:underline">
                      {node.email}
                    </a>
                  }
                />
              )}
              {node.department?.name && (
                <DetailRow
                  icon={<Building2 className="h-4 w-4" />}
                  label="Department"
                  value={node.department.name}
                />
              )}
              {node.joining_date && (
                <DetailRow
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Joined"
                  value={formatDate(node.joining_date)}
                />
              )}
              {node.managerName && (
                <DetailRow
                  icon={<UserCheck className="h-4 w-4" />}
                  label="Reports To"
                  value={node.managerName}
                />
              )}
              {node.leadName && node.leadName !== node.managerName && (
                <DetailRow
                  icon={<Crown className="h-4 w-4" />}
                  label="Lead"
                  value={node.leadName}
                />
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
