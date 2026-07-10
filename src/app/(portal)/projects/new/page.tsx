import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import { ProjectForm } from "../project-form";
import { PageHeader } from "@/components/ui/page-header";

export default async function NewProjectPage() {
  const employee = await requireAuth();
  const supabase = createAdminClient();

  const { data: allEmployees, error: employeesError } = await supabase
    .from("employees")
    .select("*")
    .order("full_name");

  if (employeesError) {
    console.error("Failed to query employees:", employeesError.message);
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Add New Project" 
        description="Create a new project or lead in the CRM." 
      />
      
      <div className="mx-auto max-w-4xl">
        <ProjectForm
          employees={allEmployees ?? []}
          currentEmployee={employee}
        />
      </div>
    </div>
  );
}
