import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import { ProjectForm } from "../project-form";
import { PageHeader } from "@/components/ui/page-header";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";

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
    <div>
      <PageBreadcrumb
        segments={[{ label: "Projects", href: "/projects" }]}
        current="Add New"
      />
      <PageHeader 
        title="Add New Project" 
        description="Create a new project or lead in the CRM." 
      />
      
      <div>
        <ProjectForm
          employees={allEmployees ?? []}
          currentEmployee={employee}
        />
      </div>
    </div>
  );
}
