import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Building2, Users } from "lucide-react";
import type { Employee } from "@/types/database";
import { TeamHierarchyDirectory } from "@/components/team/team-hierarchy-directory";

interface DepartmentWithEmployees {
  id: string;
  name: string;
  employees: Pick<
    Employee,
    | "id"
    | "full_name"
    | "email"
    | "phone"
    | "designation"
    | "role"
    | "profile_photo_url"
    | "employee_code"
  >[];
}

export default async function TeamPage() {
  const currentEmployee = await requireAuth();
  const supabase = createAdminClient();

  // Get hierarchy-based team
  const { directReports, leadTeam } = await (async () => {
    const { data: allEmployees } = await supabase
      .from("employees")
      .select("id, full_name, designation, employee_code, manager_id, lead_id, status, profile_photo_url")
      .eq("status", "active")
      .order("full_name");

    if (!allEmployees) return { directReports: [], leadTeam: [] };

    const directReports = allEmployees.filter((e) => e.manager_id === currentEmployee.id);
    const leadTeam = allEmployees.filter(
      (e) => e.lead_id === currentEmployee.id && e.manager_id !== currentEmployee.id
    );

    return { directReports, leadTeam };
  })();

  const teamMemberIds = [
    ...directReports.map(e => e.id),
    ...leadTeam.map(e => e.id)
  ];

  const hasHierarchy = teamMemberIds.length > 0;

  if (!hasHierarchy) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight">My Team</h1>
            <p className="text-muted-foreground">
              View team members who report to you
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No team members</h3>
                <p className="text-sm text-muted-foreground">
                  You don&apos;t currently have any teams or direct reports
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get departments for hierarchy view
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, email, phone, designation, role, profile_photo_url, employee_code, department_id")
    .in("id", teamMemberIds)
    .eq("status", "active")
    .order("full_name");

  const departmentsWithEmployees: DepartmentWithEmployees[] = [];
  departments?.forEach((dept) => {
    const deptEmployees = employees?.filter((emp) => emp.department_id === dept.id) ?? [];
    if (deptEmployees.length > 0) {
      departmentsWithEmployees.push({ id: dept.id, name: dept.name, employees: deptEmployees });
    }
  });
  const noDeptEmployees = employees?.filter((emp) => !emp.department_id) ?? [];
  if (noDeptEmployees.length > 0) {
    departmentsWithEmployees.push({ id: "no-dept", name: "Unassigned", employees: noDeptEmployees });
  }

  const totalHierarchy = employees?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight">My Team</h1>
          <p className="text-muted-foreground">
            {totalHierarchy} direct report{totalHierarchy !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Hierarchy Section */}
      {hasHierarchy && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Reporting Hierarchy
            </h2>
            <Link
              href="/team/hierarchy"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Users className="mr-1.5 h-3.5 w-3.5" />
              View Org Chart
            </Link>
          </div>
          <TeamHierarchyDirectory departments={departmentsWithEmployees} />
        </div>
      )}
    </div>
  );
}
