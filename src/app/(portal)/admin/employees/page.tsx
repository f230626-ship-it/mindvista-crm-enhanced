import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
          <Link href="/admin/employees/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </Link>
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
