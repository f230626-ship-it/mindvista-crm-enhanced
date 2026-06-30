import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { EmployeeForm } from "@/components/admin/employee-form";
import { EmployeesClient } from "@/components/admin/employees-client";

export default async function AdminEmployeesPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const [{ data: employees }, { data: departments }, { data: managers }] = await Promise.all([
    supabase
      .from("employees")
      .select(
        "*, department:departments(name), manager:employees!manager_id(id, full_name, employee_code), lead:employees!lead_id(id, full_name, employee_code)"
      )
      .order("full_name"),
    supabase.from("departments").select("*").order("name"),
    supabase
      .from("employees")
      .select("id, full_name, employee_code")
      .order("full_name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Employee Management"
        description="Create and manage employee records"
        action={
          <EmployeeForm
            departments={departments ?? []}
            managers={managers ?? []}
          />
        }
      />

      <EmployeesClient
        employees={employees ?? []}
        departments={departments ?? []}
        managers={managers ?? []}
      />
    </div>
  );
}
