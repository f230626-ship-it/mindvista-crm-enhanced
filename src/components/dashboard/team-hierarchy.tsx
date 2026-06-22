import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { HierarchyNode } from "@/lib/hierarchy";
import { Users } from "lucide-react";

function HierarchyNodeItem({ node, depth = 0 }: { node: HierarchyNode; depth?: number }) {
  const initials = node.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div>
      <div
        className="flex items-center gap-3 rounded-lg border border-border/60 p-3"
        style={{ marginLeft: depth * 20 }}
      >
        <Avatar className="h-9 w-9">
          <AvatarImage src={node.profile_photo_url ?? undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{node.full_name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {node.designation}
            {node.employee_code && ` · ${node.employee_code}`}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 text-xs">
          {node.relationship}
        </Badge>
      </div>
      {node.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <HierarchyNodeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TeamHierarchy({ tree }: { tree: HierarchyNode[] }) {
  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
        <Users className="mb-2 h-8 w-8 opacity-40" />
        <p className="text-sm">No team members in your hierarchy yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tree.map((node) => (
        <HierarchyNodeItem key={node.id} node={node} />
      ))}
    </div>
  );
}
