import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewEmployeeForm } from "@/components/admin/new-employee-form";

export default async function NewEmployeePage() {
  await requireRole("admin");
  const supabase = await createClient();

  const [{ data: departments }, { data: managers }] = await Promise.all([
    supabase.from("departments").select("*").order("name"),
    supabase.from("employees").select("id, full_name, employee_code").order("full_name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Add New Employee"
        description="Create a new employee account and profile"
        action={
          <Link href="/admin/employees">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Employees
            </Button>
          </Link>
        }
      />
      <NewEmployeeForm
        departments={departments ?? []}
        managers={managers ?? []}
      />
    </div>
  );
}
