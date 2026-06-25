import { requirePmRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit3 } from "lucide-react";
import { ProjectForm } from "../../project-form";
import type { Project } from "@/types/database";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const employee = await requirePmRole("admin", "coordinator");
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) {
    return notFound();
  }

  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("status", "active")
    .order("full_name");

  return (
    <div className="projects-module max-w-4xl mx-auto space-y-6">
      <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary group transition-colors duration-200">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Project
      </Link>
      <div className="pm-page-header">
        <div className="flex items-start gap-4">
          <div className="pm-section-icon">
            <Edit3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gradient-brand">Edit Project</h1>
            <p className="text-sm text-muted-foreground mt-1">{project.name} — update details, timelines, financials, or status.</p>
          </div>
        </div>
      </div>
      <ProjectForm
        employees={employees ?? []}
        currentEmployee={employee}
        project={project as unknown as Project}
      />
    </div>
  );
}
