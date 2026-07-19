import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Users } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth, isHrOrAdmin } from "@/lib/auth";
import { getTeamHierarchy, buildHierarchyTree, type HierarchyNode } from "@/lib/hierarchy";
import { TeamHierarchyTree } from "@/components/team/team-hierarchy-tree";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";

interface TeamHierarchyPageProps {
  searchParams: Promise<{ employeeId?: string }>;
}

export default async function TeamHierarchyPage({ searchParams }: TeamHierarchyPageProps) {
  const currentEmployee = await requireAuth();
  const { employeeId } = await searchParams;

  const canViewOthers = isHrOrAdmin(currentEmployee.role);
  const rootEmployeeId = employeeId && canViewOthers ? employeeId : currentEmployee.id;
  const isOwnHierarchy = rootEmployeeId === currentEmployee.id;

  const supabase = createAdminClient();

  const [{ data: rootEmployee }, hierarchy] = await Promise.all([
    supabase
      .from("employees")
      .select(
        "id, full_name, designation, employee_code, profile_photo_url, email, joining_date, role, manager_id, lead_id, department:departments(name)"
      )
      .eq("id", rootEmployeeId)
      .maybeSingle(),
    getTeamHierarchy(rootEmployeeId),
  ]);

  if (!rootEmployee) notFound();

  const childTree = buildHierarchyTree(hierarchy.all, rootEmployeeId);
  const teamSize = hierarchy.directReports.length + hierarchy.leadTeam.length;

  const nameById = new Map(hierarchy.all.map((e) => [e.id, e.full_name]));

  const rootNode: HierarchyNode = {
    ...(rootEmployee as unknown as Omit<HierarchyNode, "relationship" | "children" | "managerName" | "leadName">),
    manager_id: null,
    lead_id: null,
    managerName: rootEmployee.manager_id ? nameById.get(rootEmployee.manager_id) ?? null : null,
    leadName: rootEmployee.lead_id ? nameById.get(rootEmployee.lead_id) ?? null : null,
    relationship: isOwnHierarchy ? "You" : "Team Lead",
    children: childTree,
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        segments={[{ label: "My Team", href: "/team" }]}
        current="Hierarchy"
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Hierarchy</h1>
          <p className="text-sm text-muted-foreground">
            {isOwnHierarchy
              ? `${teamSize} ${teamSize === 1 ? "member" : "members"} reporting to you`
              : `${rootEmployee.full_name}'s reporting structure`}
          </p>
        </div>
      </div>

      <TeamHierarchyTree root={rootNode} currentEmployeeId={currentEmployee.id} />
    </div>
  );
}
