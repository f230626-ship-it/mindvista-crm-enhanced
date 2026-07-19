import { createClient } from "@/lib/supabase/server";
import type { Employee } from "@/types/database";

export async function getTeamHierarchy(currentEmployeeId: string) {
  const supabase = await createClient();

  const { data: allEmployees } = await supabase
    .from("employees")
    .select(
      "id, full_name, designation, employee_code, manager_id, lead_id, status, profile_photo_url, email, joining_date, role, department:departments(name)"
    )
    .eq("status", "active")
    .order("full_name");

  if (!allEmployees) return { directReports: [], leadTeam: [], all: [] };

  const nameById = new Map(allEmployees.map((e) => [e.id, e.full_name]));
  const withNames = allEmployees.map((e) => ({
    ...e,
    managerName: e.manager_id ? nameById.get(e.manager_id) ?? null : null,
    leadName: e.lead_id ? nameById.get(e.lead_id) ?? null : null,
  }));

  const directReports = withNames.filter((e) => e.manager_id === currentEmployeeId);
  const leadTeam = withNames.filter(
    (e) => e.lead_id === currentEmployeeId && e.manager_id !== currentEmployeeId
  );

  return {
    directReports: directReports as unknown as HierarchyMember[],
    leadTeam: leadTeam as unknown as HierarchyMember[],
    all: withNames as unknown as HierarchyMember[],
  };
}

export type HierarchyMember = Pick<
  Employee,
  "id" | "full_name" | "designation" | "manager_id" | "lead_id" | "profile_photo_url" | "email" | "joining_date" | "role"
> & {
  employee_code: string | null;
  department: { name: string } | null;
  managerName: string | null;
  leadName: string | null;
};

export function buildHierarchyTree(
  members: HierarchyMember[],
  rootId: string
): HierarchyNode[] {
  const children = members.filter(
    (m) => m.manager_id === rootId || m.lead_id === rootId
  );
  const seen = new Set<string>();

  return children
    .filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    })
    .map((m) => ({
      ...m,
      relationship:
        m.manager_id === rootId && m.lead_id === rootId
          ? "Reports to & Lead"
          : m.manager_id === rootId
            ? "Reports to"
            : "Lead",
      children: buildHierarchyTree(
        members.filter((x) => x.id !== m.id),
        m.id
      ),
    }));
}

export interface HierarchyNode extends HierarchyMember {
  relationship: string;
  children: HierarchyNode[];
}
