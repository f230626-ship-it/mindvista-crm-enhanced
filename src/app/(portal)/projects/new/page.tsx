import { requirePmRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "../project-form";
import { PageHeader } from "@/components/ui/page-header";

export default async function NewProjectPage() {
  const employee = await requirePmRole("admin", "coordinator");
  const supabase = await createClient();

  // Load all employees for ownership assignment dropdowns
  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("status", "active")
    .order("full_name");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Add New Project"
        description="Log a new won deal or client project into the system."
      />
      <ProjectForm employees={employees ?? []} currentEmployee={employee} />
    </div>
  );
}
