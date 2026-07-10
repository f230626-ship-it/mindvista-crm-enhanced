import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminAccess } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EmployeesClient } from "@/components/admin/employees-client";

export default async function AdminEmployeesPage() {
  await requireAdminAccess();
  const supabase = createAdminClient();

  const [{ data: employees }, { data: departments }, { data: managers }] = await Promise.all([
    supabase
      .from("employees")
      .select(
        "*, department:departments(name)"
      )
      .order("full_name"),
    supabase.from("departments").select("*").order("name"),
    supabase
      .from("employees")
      .select("id, full_name, employee_code")
      .order("full_name"),
  ]);

  const employeeIds = (employees ?? []).map((e) => e.id);
  const managerIds = [...new Set((employees ?? []).map((e) => e.manager_id).filter(Boolean))] as string[];
  const leadIds = [...new Set((employees ?? []).map((e) => e.lead_id).filter(Boolean))] as string[];

  const uniqueRelatedIds = [...new Set([...managerIds, ...leadIds])].filter((id) => !employeeIds.includes(id));

  let relatedEmployees: Record<string, { id: string; full_name: string; employee_code: string | null }> = {};
  if (uniqueRelatedIds.length > 0) {
    const { data: related } = await supabase
      .from("employees")
      .select("id, full_name, employee_code")
      .in("id", uniqueRelatedIds);
    if (related) {
      relatedEmployees = Object.fromEntries(related.map((e) => [e.id, e]));
    }
  }

  const enrichedEmployees = (employees ?? []).map((emp) => ({
    ...emp,
    manager: emp.manager_id
      ? relatedEmployees[emp.manager_id] ?? employees?.find((e) => e.id === emp.manager_id) ?? null
      : null,
    lead: emp.lead_id
      ? relatedEmployees[emp.lead_id] ?? employees?.find((e) => e.id === emp.lead_id) ?? null
      : null,
  }));

  return (
    <div>
      <PageHeader
        title="Employee Management"
        description="Create and manage employee records"
        action={
          <Link href="/admin/employees/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </Link>
        }
      />

      <EmployeesClient
        employees={enrichedEmployees ?? []}
        departments={departments ?? []}
        managers={managers ?? []}
      />
    </div>
  );
}
