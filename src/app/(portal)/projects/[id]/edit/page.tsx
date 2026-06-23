import { requirePmRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProjectForm } from "../../project-form";
import { PageHeader } from "@/components/ui/page-header";
import type { Project } from "@/types/database";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const employee = await requirePmRole("admin", "coordinator");
  const supabase = await createClient();

  // Load project details
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) {
    return notFound();
  }

  // Load all employees for dropdowns
  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("status", "active")
    .order("full_name");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={`Edit Project: ${project.name}`}
        description="Update project details, timelines, financials, or status."
      />
      <ProjectForm
        employees={employees ?? []}
        currentEmployee={employee}
        project={project as unknown as Project}
      />
    </div>
  );
}
