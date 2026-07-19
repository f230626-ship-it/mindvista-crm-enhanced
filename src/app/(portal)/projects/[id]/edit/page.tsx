import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ProjectForm } from "../../project-form";
import { PageHeader } from "@/components/ui/page-header";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";

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
    <div>
      <PageBreadcrumb
        segments={[
          { label: "Projects", href: "/projects" },
          { label: project.name, href: `/projects/${id}` }
        ]}
        current="Edit"
      />
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
