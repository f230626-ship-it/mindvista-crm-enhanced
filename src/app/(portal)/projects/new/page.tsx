import { requirePmRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "../project-form";
import Link from "next/link";
import { ArrowLeft, Briefcase } from "lucide-react";

export default async function NewProjectPage() {
  const employee = await requirePmRole("admin");
  const supabase = await createClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("status", "active")
    .order("full_name");

  return (
    <div className="projects-module max-w-4xl mx-auto space-y-6">
      <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary group transition-colors duration-200">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Projects
      </Link>
      <div className="pm-page-header">
        <div className="flex items-start gap-4">
          <div className="pm-section-icon">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gradient-brand">Add New Project</h1>
            <p className="text-sm text-muted-foreground mt-1">Log a new won deal or client project into the system.</p>
          </div>
        </div>
      </div>
      <ProjectForm employees={employees ?? []} currentEmployee={employee} />
    </div>
  );
}
