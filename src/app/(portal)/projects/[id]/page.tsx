import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import ProjectDetailsClient from "./project-details-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const employee = await requireAuth();
  const supabase = await createClient();

  // Retrieve project details. RLS automatically enforces security based on pm_role.
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(`
      *,
      bd:employees!bd_id(id, full_name, email),
      manager:employees!manager_id(id, full_name, email),
      closing_developer:employees!closing_developer_id(id, full_name, email),
      resources:project_resources(
        *,
        employee:employees(id, full_name, email)
      )
    `)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    console.error("Failed to query project detail:", projectError.message);
  }

  // If no project is returned, it either doesn't exist or RLS blocked the user.
  if (!project) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center space-y-4">
        <Card className="border-destructive/20 bg-card/80 backdrop-blur-sm shadow-lg">
          <CardHeader className="flex flex-col items-center pb-2">
            <ShieldAlert className="h-12 w-12 text-destructive" />
            <CardTitle className="text-lg font-bold mt-2">Access Denied or Not Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The project you are trying to access does not exist, or your user role does not have permission to view it.
            </p>
            <div className="pt-2">
              <Link href="/projects">
                <Button className="w-full font-semibold">
                  Back to Projects
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Retrieve project audit logs
  const { data: auditLogs, error: logsError } = await supabase
    .from("project_audit_logs")
    .select(`
      *,
      actor:employees!actor_id(id, full_name, email)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (logsError) {
    console.error("Failed to fetch project audit logs:", logsError.message);
  }

  // Load all active employees for potential team allocations
  const { data: allEmployees, error: employeesError } = await supabase
    .from("employees")
    .select("*")
    .eq("status", "active")
    .order("full_name");

  if (employeesError) {
    console.error("Failed to load employees for assignment:", employeesError.message);
  }

  return (
    <ProjectDetailsClient
      project={project as unknown as Parameters<typeof ProjectDetailsClient>[0]["project"]}
      auditLogs={(auditLogs as unknown as Parameters<typeof ProjectDetailsClient>[0]["auditLogs"]) ?? []}
      currentEmployee={employee}
      allEmployees={allEmployees ?? []}
    />
  );
}
