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
  TrendingUp,
  FolderOpen,
  Play,
  Pause,
  Check,
  Activity,
  X,
  Lock,
  HelpCircle,
  DollarSign,
  Briefcase
} from "lucide-react";
import { ResourceAssignmentDialog } from "../resource-assignment-dialog";
import { CircularProgress } from "@/components/projects/premium-ui";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/date";
import type { Project, Employee, ProjectResource, ProjectAuditLog } from "@/types/database";

const getStatusBadge = (status: string) => {
  const baseClass = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all duration-200";
  switch (status) {
    case "Lead Won":
      return <span className={`${baseClass} bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400 dark:bg-blue-500/5`}><TrendingUp className="h-3 w-3" /> Lead Won</span>;
    case "Onboarding":
      return <span className={`${baseClass} bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400 dark:bg-indigo-500/5`}><FolderOpen className="h-3 w-3" /> Onboarding</span>;
    case "In Progress":
      return <span className={`${baseClass} bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/5`}><Play className="h-3 w-3 fill-current" /> In Progress</span>;
    case "On Hold":
      return <span className={`${baseClass} bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400 dark:bg-orange-500/5`}><Pause className="h-3 w-3 fill-current" /> On Hold</span>;
    case "Completed":
      return <span className={`${baseClass} bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400 dark:bg-green-500/5`}><Check className="h-3 w-3" /> Completed</span>;
    case "Maintenance":
      return <span className={`${baseClass} bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400 dark:bg-teal-500/5`}><Activity className="h-3 w-3" /> Maintenance</span>;
    case "Paused":
      return <span className={`${baseClass} bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400 dark:bg-purple-500/5`}><Pause className="h-3 w-3" /> Paused</span>;
    case "Cancelled":
      return <span className={`${baseClass} bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400 dark:bg-red-500/5`}><X className="h-3 w-3" /> Cancelled</span>;
    case "Archived":
      return <span className={`${baseClass} bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400 dark:bg-slate-500/5`}><Lock className="h-3 w-3" /> Archived</span>;
    default:
      return <span className={`${baseClass} bg-slate-500/10 text-slate-600 border-slate-500/20`}><HelpCircle className="h-3 w-3" /> {status}</span>;
  }
};

const getPriorityBadge = (priority?: string) => {
  const baseClass = "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all duration-200";
  switch (priority) {
    case "High":
      return <span className={`${baseClass} bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400 dark:bg-red-500/5`}>High</span>;
    case "Medium":
      return <span className={`${baseClass} bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/5`}>Medium</span>;
    case "Low":
      return <span className={`${baseClass} bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400 dark:bg-slate-500/5`}>Low</span>;
    default:
      return <span className={`${baseClass} bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400 dark:bg-slate-500/5`}>Medium</span>;
  }
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
    <div className="projects-module space-y-6">
      {/* Top back button and actions bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary group transition-colors duration-200">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Projects
        </Link>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Details vs Audit Logs Tabs */}
          <div className="pm-tabs">
            <button
              onClick={() => setActiveTab("details")}
              className={`pm-tab ${activeTab === "details" ? "pm-tab-active" : ""}`}
            >
              Project Details
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`pm-tab ${activeTab === "logs" ? "pm-tab-active" : ""}`}
            >
              Activity Logs ({auditLogs.length})
            </button>
          </div>

          {/* Edit/Delete Actions */}
          {isWritable && (
            <Link href={`/projects/${project.id}/edit`}>
              <Button variant="outline" size="sm" className="pm-btn-outline">
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
              className="font-semibold shadow-sm bg-red-500/10 border border-red-500/20 text-red-600 hover:bg-red-600 hover:text-white dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
            <Card className="pm-section-card">
              <CardHeader className="pb-4 border-b border-border/40 bg-muted/10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" /> Project Specification
                    </div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight">{project.name}</h2>
                    {project.company_name && (
                      <p className="text-sm font-semibold text-muted-foreground">{project.company_name}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <CircularProgress value={project.progress_percentage || 0} size={52} strokeWidth={4} />
                    <div className="flex flex-wrap items-center gap-2">
                      {getPriorityBadge(project.priority)}
                      {getStatusBadge(project.status)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Descriptive values */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2.5 p-4 rounded-xl bg-muted/30 border border-border/20">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary" /> Client Representative
                    </span>
                    <div className="space-y-1">
                      <p className="text-base font-bold text-foreground">{project.client_name}</p>
                      <p className="text-xs text-muted-foreground font-medium font-mono">{project.client_email}</p>
                      {project.client_contact_number && (
                        <p className="text-xs text-muted-foreground font-medium font-mono mt-0.5">{project.client_contact_number}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2.5 p-4 rounded-xl bg-muted/30 border border-border/20">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-primary" /> Industry Verticals
                    </span>
                    <p className="text-base font-bold text-foreground">{project.industry}</p>
                  </div>
                </div>

                {project.description && (
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Project Parameters & Description</span>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/20 p-4 rounded-xl border border-border/20 font-light">{project.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assigned Resources */}
            <Card className="pm-section-card overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/40 bg-muted/10">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-1.5">
                    <User className="h-4 w-4 text-primary" /> Allocated Team Resources
                  </CardTitle>
                  <CardDescription className="text-xs">Members currently working on this project</CardDescription>
                </div>
                {isWritable && (
                  <ResourceAssignmentDialog projectId={project.id} employees={allEmployees} />
                )}
              </CardHeader>
              <CardContent className="p-0">
                <Table className="pm-table">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[10px] tracking-wider uppercase text-muted-foreground py-3">Employee</TableHead>
                      <TableHead className="text-[10px] tracking-wider uppercase text-muted-foreground py-3">Role</TableHead>
                      <TableHead className="text-[10px] tracking-wider uppercase text-muted-foreground py-3 text-center">Allocation</TableHead>
                      <TableHead className="text-[10px] tracking-wider uppercase text-muted-foreground py-3">Start Date</TableHead>
                      <TableHead className="text-[10px] tracking-wider uppercase text-muted-foreground py-3">End Date</TableHead>
                      {isWritable && <TableHead className="w-20 text-right py-3" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.resources.length > 0 ? (
                      project.resources.map((res) => (
                        <TableRow key={res.id} className="group">
                          <TableCell className="font-semibold py-3.5">{res.employee.full_name}</TableCell>
                          <TableCell className="py-3.5">
                            <Badge variant="outline" className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 border-border/60">
                              {res.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3.5 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="font-mono font-bold text-primary text-xs">{res.allocation_percentage}%</span>
                              <div className="pm-progress-track-sm w-16">
                                <div
                                  className="pm-progress-fill-sm"
                                  style={{ width: `${res.allocation_percentage}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground py-3.5">{res.start_date}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground py-3.5">{res.end_date}</TableCell>
                          {isWritable && (
                            <TableCell className="text-right py-3.5">
                              <div className="flex items-center justify-end gap-1.5">
                                <ResourceAssignmentDialog
                                  projectId={project.id}
                                  employees={allEmployees}
                                  existingAssignment={res}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveResource(res.id)}
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-28 text-center text-sm text-muted-foreground">
                          <div className="flex flex-col items-center justify-center gap-2 py-6">
                            <User className="h-8 w-8 text-muted-foreground/30" />
                            <p className="font-medium text-muted-foreground/60">No resources currently allocated to this project.</p>
                          </div>
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
              <Card className="pm-section-card">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
                  <CardTitle className="text-base font-bold flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-primary" /> Project Financials
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  <div className="flex items-center justify-between pb-3.5 border-b border-border/40">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project Value</span>
                    <span className="text-2xl font-black text-primary tracking-tight font-mono">
                      ${Number(project.value).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{project.currency}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2.5 border-b border-border/40">
                    <span className="text-xs text-muted-foreground">Monthly Retainer</span>
                    <Badge variant={project.is_monthly_retainer ? "default" : "outline"} className={project.is_monthly_retainer ? "bg-primary text-primary-foreground font-semibold px-2" : "border-border/60 text-muted-foreground"}>
                      {project.is_monthly_retainer ? "Yes" : "No"}
                    </Badge>
                  </div>

                  {project.is_monthly_retainer && (
                    <div className="flex items-center justify-between py-2.5 border-b border-border/40">
                      <span className="text-xs text-muted-foreground">Retainer Amount</span>
                      <span className="text-sm font-bold font-mono text-foreground">
                        ${Number(project.retainer_amount || 0).toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">/mo</span>
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-2.5 border-b border-border/40">
                    <span className="text-xs text-muted-foreground">Expected Profit Margin</span>
                    <span className="text-sm font-bold font-mono text-green-600 dark:text-green-400">
                      {project.expected_profit ? `$${Number(project.expected_profit).toLocaleString()}` : "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Payment Status</span>
                    <Badge className={`font-bold uppercase text-[10px] tracking-wide px-2.5 py-0.5 ${
                      project.payment_status === "Paid" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                      project.payment_status === "Partial" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                      project.payment_status === "Overdue" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                      "bg-slate-500/10 text-slate-600 border-slate-500/20"
                    }`}>
                      {project.payment_status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-border/40 bg-card/45 backdrop-blur-sm shadow-premium">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    Financial Isolation
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
            <Card className="pm-section-card">
              <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
                <CardTitle className="text-base font-bold flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" /> Timeline & Stakeholders
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 text-sm p-3.5 rounded-xl bg-muted/30 border border-border/20">
                    <Calendar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Timeline Milestones</div>
                      <div className="text-xs text-foreground">
                        <span className="text-muted-foreground font-medium">Start Date:</span> <strong className="font-mono">{project.start_date}</strong>
                      </div>
                      <div className="text-xs text-foreground">
                        <span className="text-muted-foreground font-medium">Expected Delivery:</span> <strong className="font-mono">{project.expected_delivery_date}</strong>
                      </div>
                      {project.actual_delivery_date && (
                        <div className="text-xs text-green-600 dark:text-green-400 font-semibold">
                          <span>Delivered On:</span> <strong className="font-mono">{project.actual_delivery_date}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-sm p-3.5 rounded-xl bg-muted/30 border border-border/20">
                    <User className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Stakeholders</div>
                      <div className="text-xs text-foreground">
                        <span className="text-muted-foreground font-medium">BD Representative:</span> <strong>{project.bd?.full_name || "—"}</strong>
                      </div>
                      <div className="text-xs text-foreground">
                        <span className="text-muted-foreground font-medium">Project Manager (PM):</span> <strong>{project.manager?.full_name || "—"}</strong>
                      </div>
                      {project.closing_developer && (
                        <div className="text-xs text-foreground">
                          <span className="text-muted-foreground font-medium">Closing Dev:</span> <strong>{project.closing_developer.full_name}</strong>
                        </div>
                      )}
                      <div className="text-xs text-foreground pt-1 border-t border-border/30 mt-1">
                        <span className="text-muted-foreground font-medium">Lead Origin:</span> <Badge variant="secondary" className="text-[10px] font-mono py-0 px-1.5 bg-background border-border/60 text-muted-foreground">{project.lead_source}</Badge>
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
        <Card className="pm-section-card">
          <CardHeader className="pb-4 border-b border-border/40 bg-muted/10">
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-primary" /> System Audit Trail
            </CardTitle>
            <CardDescription className="text-xs">Permanent, un-modifiable record of project events and resource configurations</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 px-6">
            {auditLogs.length > 0 ? (
              <div className="relative pl-6 space-y-6">
                {/* Vertical timeline line */}
                <div className="absolute left-3.5 top-2 bottom-2 w-[2px] bg-border/80" />

                {auditLogs.map((log) => {
                  // Prettify details json
                  let detailsString = "";
                  let hasChanges = false;
                  if (log.details && typeof log.details === "object") {
                    const entries = Object.entries(log.details);
                    if (entries.length > 0) {
                      hasChanges = true;
                      detailsString = entries
                        .map(([key, value]) => {
                          if (Array.isArray(value) && value.length === 2) {
                            return `${key}: "${value[0]}" → "${value[1]}"`;
                          }
                          return `${key}: "${JSON.stringify(value)}"`;
                        })
                        .join(", ");
                    }
                  }

                  const dateObj = new Date(log.created_at);
                  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div key={log.id} className="relative flex gap-4 timeline-item group">
                      {/* Timeline dot */}
                      <div className="pm-timeline-dot" />
                      
                      <div className="flex-1 space-y-1.5 bg-muted/20 p-4 rounded-xl border border-border/40 transition-colors hover:bg-muted/40">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">
                              {log.actor?.full_name || "System Automated"}
                            </span>
                            <Badge variant="secondary" className="bg-primary/10 border border-primary/20 text-[10px] text-primary uppercase font-bold tracking-wider py-0.5 px-2">
                              {log.action}
                            </Badge>
                          </div>
                          <span className="font-mono text-xs text-muted-foreground font-semibold bg-background border border-border/40 px-2 py-0.5 rounded-md">
                            {formatDate(log.created_at)} at {formattedTime}
                          </span>
                        </div>

                        {hasChanges && (
                          <div className="text-xs text-muted-foreground font-mono bg-background/50 border border-border/30 p-3 rounded-lg overflow-x-auto select-all leading-relaxed max-w-full">
                            {detailsString}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-10">
                <Activity className="h-10 w-10 text-muted-foreground/30" />
                <p className="font-semibold text-muted-foreground/50">No activities logged yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
