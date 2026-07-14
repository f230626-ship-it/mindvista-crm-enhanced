import { requireAdminAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/page-header";
import { NewEmployeeForm } from "@/components/admin/new-employee-form";

export default async function NewEmployeePage() {
  await requireAdminAccess();
  const supabase = createAdminClient();

  const [{ data: departments }, { data: managers }] = await Promise.all([
    supabase.from("departments").select("*").order("name"),
    supabase
      .from("employees")
      .select("id, full_name, employee_code")
      .in("role", ["admin"])
      .order("full_name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Add New Employee"
        description="Create a new employee account"
      />

      <NewEmployeeForm
        departments={departments ?? []}
        managers={managers ?? []}
      />
    </div>
  );
}