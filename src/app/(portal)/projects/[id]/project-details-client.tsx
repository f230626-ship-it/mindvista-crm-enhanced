"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteProject, removeResource } from "@/actions/projects";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Trash2,
  Edit3,
  ArrowLeft,
  User,
  ShieldAlert,
} from "lucide-react";
import { ResourceAssignmentDialog } from "../resource-assignment-dialog";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/date";
import type { Project, Employee, ProjectResource, ProjectAuditLog } from "@/types/database";

const STATUS_COLORS: Record<string, string> = {
  "Lead Won": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "Onboarding": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  "In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "On Hold": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  "Completed": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Maintenance": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  "Paused": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "Cancelled": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "Archived": "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
};

interface ProjectDetailsClientProps {
  project: Project & {
    bd: Pick<Employee, "id" | "full_name" | "email"> | null;
    manager: Pick<Employee, "id" | "full_name" | "email"> | null;
    closing_developer?: Pick<Employee, "id" | "full_name" | "email"> | null;
    resources: (ProjectResource & { employee: Pick<Employee, "id" | "full_name" | "email"> })[];
  };
  auditLogs: (ProjectAuditLog & { actor?: Pick<Employee, "id" | "full_name" | "email"> | null })[];
  currentEmployee: Employee;
  allEmployees: Employee[];
}

export default function ProjectDetailsClient({
  project,
  auditLogs,
  currentEmployee,
  allEmployees,
}: ProjectDetailsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"details" | "logs">("details");
  const [deleting, setDeleting] = useState(false);

  const isAdmin = currentEmployee.pm_role === "admin";
  const isCoordinator = currentEmployee.pm_role === "coordinator";
  const isWritable = isAdmin || isCoordinator;
  
  // Financial visibility is blocked for developers
  const canSeeFinancials = currentEmployee.pm_role !== "developer";

  async function handleDelete() {
    if (!confirm("Are you sure you want to permanently delete this project? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const result = await deleteProject(project.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Project deleted successfully.");
        router.push("/projects");
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleRemoveResource(assignmentId: string) {
    if (!confirm("Are you sure you want to remove this employee from the project?")) {
      return;
    }

    try {
      const result = await removeResource(project.id, assignmentId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Resource unassigned.");
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An error occurred.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Top back button and actions bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Link>
        
        <div className="flex items-center gap-3">
          {/* Details vs Audit Logs Tabs */}
          <div className="flex rounded-lg bg-muted p-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab("details")}
              className={`rounded-md px-3 py-1.5 transition-all duration-200 ${
                activeTab === "details"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Project Details
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`rounded-md px-3 py-1.5 transition-all duration-200 ${
                activeTab === "logs"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Activity Logs ({auditLogs.length})
            </button>
          </div>

          {/* Edit/Delete Actions */}
          {isWritable && (
            <Link href={`/projects/${project.id}/edit`}>
              <Button variant="outline" size="sm" className="font-semibold shadow-sm">
                <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit Project
              </Button>
            </Link>
          )}

          {isAdmin && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="font-semibold shadow-sm"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> {deleting ? "Deleting..." : "Delete Project"}
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================== */}
      {/* --- DETAILS TAB VIEW --- */}
      {/* ========================================================== */}
      {activeTab === "details" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info Columns (2 Columns Wide) */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Info */}
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{project.name}</h2>
                    <p className="text-sm text-muted-foreground">{project.company_name || "No Company Specified"}</p>
                  </div>
                  <Badge className={STATUS_COLORS[project.status] || "bg-slate-100 text-slate-800"}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Descriptive values */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Client Representative</span>
                    <p className="text-sm font-medium text-foreground">{project.client_name}</p>
                    <p className="text-xs text-muted-foreground">{project.client_email}</p>
                    {project.client_contact_number && (
                      <p className="text-xs text-muted-foreground">{project.client_contact_number}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Industry Verticals</span>
                    <p className="text-sm font-medium text-foreground">{project.industry}</p>
                  </div>
                </div>

                {project.description && (
                  <div className="border-t pt-4">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Project Parameters & Description</span>
                    <p className="mt-1.5 text-sm text-foreground whitespace-pre-wrap leading-relaxed">{project.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assigned Resources */}
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-base font-semibold">Allocated Team Resources</CardTitle>
                  <CardDescription>Members currently working on this project</CardDescription>
                </div>
                {isWritable && (
                  <ResourceAssignmentDialog projectId={project.id} employees={allEmployees} />
                )}
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-center">Allocation</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      {isWritable && <TableHead className="w-20 text-right" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.resources.length > 0 ? (
                      project.resources.map((res) => (
                        <TableRow key={res.id}>
                          <TableCell className="font-semibold">{res.employee.full_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs font-semibold">
                              {res.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-primary">
                            {res.allocation_percentage}%
                          </TableCell>
                          <TableCell className="text-xs">{res.start_date}</TableCell>
                          <TableCell className="text-xs">{res.end_date}</TableCell>
                          {isWritable && (
                            <TableCell className="text-right flex items-center justify-end gap-1.5">
                              <ResourceAssignmentDialog
                                projectId={project.id}
                                employees={allEmployees}
                                existingAssignment={res}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveResource(res.id)}
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                          No resources currently allocated to this project.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Columns (1 Column Wide) */}
          <div className="space-y-6">
            {/* Financial Details (Hidden for Developer resource) */}
            {canSeeFinancials ? (
              <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Project Financials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Project Value</span>
                    <span className="text-xl font-black text-primary">
                      ${Number(project.value).toLocaleString()} {project.currency}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b">
                    <span className="text-xs text-muted-foreground">Monthly Retainer</span>
                    <Badge variant={project.is_monthly_retainer ? "default" : "outline"}>
                      {project.is_monthly_retainer ? "Yes" : "No"}
                    </Badge>
                  </div>

                  {project.is_monthly_retainer && (
                    <div className="flex items-center justify-between py-1.5 border-b">
                      <span className="text-xs text-muted-foreground">Retainer Amount</span>
                      <span className="text-sm font-semibold font-mono">
                        ${Number(project.retainer_amount || 0).toLocaleString()} /mo
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-1.5 border-b">
                    <span className="text-xs text-muted-foreground">Expected Profit Margin</span>
                    <span className="text-sm font-semibold font-mono text-green-600 dark:text-green-400">
                      {project.expected_profit ? `$${Number(project.expected_profit).toLocaleString()}` : "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">Payment Status</span>
                    <Badge className="font-semibold uppercase text-[10px]">
                      {project.payment_status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    Financial Isolation Active
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Financial records for this project are locked. Only project management roles and business development officials have viewing permissions.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Timelines and Ownership */}
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Timeline & Ownership</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">Timeline Milestones</div>
                      <div className="text-xs mt-1">
                        <strong className="text-muted-foreground">Start:</strong> {project.start_date}
                      </div>
                      <div className="text-xs mt-0.5">
                        <strong className="text-muted-foreground">Expected Delivery:</strong> {project.expected_delivery_date}
                      </div>
                      {project.actual_delivery_date && (
                        <div className="text-xs mt-0.5 text-green-600 dark:text-green-400">
                          <strong>Delivered:</strong> {project.actual_delivery_date}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-3 flex items-start gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">Stakeholders</div>
                      <div className="text-xs mt-1">
                        <strong className="text-muted-foreground">BD Representative:</strong> {project.bd?.full_name || "—"}
                      </div>
                      <div className="text-xs mt-0.5">
                        <strong className="text-muted-foreground">Project Manager (PM):</strong> {project.manager?.full_name || "—"}
                      </div>
                      {project.closing_developer && (
                        <div className="text-xs mt-0.5">
                          <strong className="text-muted-foreground">Closing Dev:</strong> {project.closing_developer.full_name}
                        </div>
                      )}
                      <div className="text-xs mt-1.5">
                        <strong className="text-muted-foreground">Lead Origin Source:</strong> {project.lead_source}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* --- AUDIT LOGS TAB VIEW --- */}
      {/* ========================================================== */}
      {activeTab === "logs" && (
        <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">System Audit Trail</CardTitle>
            <CardDescription>Permanent, un-modifiable record of project events and resource configurations</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Timestamp</TableHead>
                  <TableHead className="w-48">Actor</TableHead>
                  <TableHead className="w-48">Action</TableHead>
                  <TableHead>Modifications / Log Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => {
                    // Prettify details json
                    let detailsString = "—";
                    if (log.details && typeof log.details === "object") {
                      detailsString = Object.entries(log.details)
                        .map(([key, value]) => {
                          if (Array.isArray(value) && value.length === 2) {
                            return `${key}: "${value[0]}" → "${value[1]}"`;
                          }
                          return `${key}: "${JSON.stringify(value)}"`;
                        })
                        .join(", ");
                    }

                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {formatDate(log.created_at)} {new Date(log.created_at).toLocaleTimeString()}
                        </TableCell>
                        <TableCell className="font-medium text-xs">
                          {log.actor?.full_name || "System Automated"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                          {detailsString}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                      No activities logged yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
