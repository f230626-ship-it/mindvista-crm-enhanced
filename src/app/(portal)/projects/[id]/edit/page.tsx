import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ProjectForm } from "../../project-form";
import { PageHeader } from "@/components/ui/page-header";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const employee = await requireRole("admin");
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: project }, { data: allEmployees }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase.from("employees").select("*").order("full_name"),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Project"
        description={`Editing ${project.name}`}
      />

      <div>
        <ProjectForm
          employees={allEmployees ?? []}
          currentEmployee={employee}
          project={project}
        />
      </div>
    </div>
  );
}
