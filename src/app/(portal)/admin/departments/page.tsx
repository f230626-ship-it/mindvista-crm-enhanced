import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminAccess } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { DepartmentDirectoryClient } from "@/components/admin/department-directory-client";

export default async function AdminDepartmentsPage() {
  await requireAdminAccess();
  const supabase = createAdminClient();

  const [{ data: departments }, { data: employees }] = await Promise.all([
    supabase.from("departments").select("id, name").order("name"),
    supabase
      .from("employees")
      .select("id, full_name, employee_code, designation, role, profile_photo_url, department_id, manager_id")
      .eq("status", "active")
      .order("full_name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Browse the company directory by department"
      />

      <DepartmentDirectoryClient
        departments={departments ?? []}
        employees={employees ?? []}
      />
    </div>
  );
}
