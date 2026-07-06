import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ProfilePhotoUpload } from "@/components/profile/profile-photo-upload";
import { ProfileForm } from "@/components/profile/profile-form";
import { Badge } from "@/components/ui/badge";
import {
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYEE_STATUS_LABELS,
} from "@/lib/constants";
import { formatDate } from "@/lib/utils/date";
import {
  Building2,
  Briefcase,
  CalendarDays,
  Hash,
  Users,
  UserCheck,
  Shield,
  Activity,
} from "lucide-react";

export default async function ProfilePage() {
  const employee = await requireAuth();
  const supabase = await createClient();

  // Fetch manager name if present
  let managerName: string | null = null;
  if (employee.manager_id) {
    const { data: mgr } = await supabase
      .from("employees")
      .select("full_name")
      .eq("id", employee.manager_id)
      .maybeSingle();
    managerName = mgr?.full_name ?? null;
  }

  // Fetch lead name if present and different from manager
  let leadName: string | null = null;
  if (employee.lead_id && employee.lead_id !== employee.manager_id) {
    const { data: ld } = await supabase
      .from("employees")
      .select("full_name")
      .eq("id", employee.lead_id)
      .maybeSingle();
    leadName = ld?.full_name ?? null;
  }

  // Fetch direct report count (team size)
  const { count: teamCount } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("manager_id", employee.id)
    .eq("status", "active");

  const initials = employee.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    inactive: "bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-400",
    suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div>
      <PageHeader title="My Profile" description="Your organizational profile" />

      {/* ── Hero: Avatar + Name + Title ── */}
      <div className="mb-6 rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
        <div className="px-6 pb-6 -mt-12 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="relative shrink-0">
            <div className="rounded-2xl border-4 border-card bg-card p-4 shadow-lg overflow-hidden">
              <ProfilePhotoUpload
                employeeId={employee.id}
                fullName={employee.full_name}
                currentUrl={employee.profile_photo_url}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <h2 className="text-2xl font-bold tracking-tight truncate">{employee.full_name}</h2>
            <p className="text-base text-muted-foreground truncate">{employee.designation}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge className={statusColors[employee.status]}>
                {EMPLOYEE_STATUS_LABELS[employee.status]}
              </Badge>
              <Badge variant="outline" className="font-mono">
                {EMPLOYMENT_TYPE_LABELS[employee.employment_type]}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ── Org Info Card Grid ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">

        {/* Employee ID */}
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm flex items-start gap-3">
          <div className="flex items-center justify-center shrink-0">
            <Hash className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Employee ID</p>
            <p className="text-base font-bold font-mono tracking-wide">
              {employee.employee_code ?? "—"}
            </p>
          </div>
        </div>

        {/* Department */}
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm flex items-start gap-3">
          <div className="flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Department</p>
            <p className="text-sm font-semibold truncate">{employee.department?.name ?? "—"}</p>
          </div>
        </div>

        {/* Role / Position */}
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm flex items-start gap-3">
          <div className="flex items-center justify-center shrink-0">
            <Briefcase className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Position</p>
            <p className="text-sm font-semibold truncate">{employee.designation}</p>
          </div>
        </div>

        {/* Employment Status */}
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm flex items-start gap-3">
          <div className="flex items-center justify-center shrink-0">
            <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Status</p>
            <Badge className={statusColors[employee.status] + " text-xs"}>
              {EMPLOYEE_STATUS_LABELS[employee.status]}
            </Badge>
          </div>
        </div>

        {/* Join Date */}
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm flex items-start gap-3">
          <div className="flex items-center justify-center shrink-0">
            <CalendarDays className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Join Date</p>
            <p className="text-sm font-semibold">{formatDate(employee.joining_date)}</p>
          </div>
        </div>

        {/* Manager */}
        {managerName && (
          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm flex items-start gap-3">
            <div className="flex items-center justify-center shrink-0">
              <UserCheck className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Manager</p>
              <p className="text-sm font-semibold truncate">{managerName}</p>
            </div>
          </div>
        )}

        {/* Lead */}
        {leadName && (
          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm flex items-start gap-3">
            <div className="flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Team Lead</p>
              <p className="text-sm font-semibold truncate">{leadName}</p>
            </div>
          </div>
        )}

        {/* Team Size (if manager) */}
        {(teamCount ?? 0) > 0 && (
          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm flex items-start gap-3">
            <div className="flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Team</p>
              <p className="text-base font-bold">{teamCount}</p>
              <p className="text-xs text-muted-foreground">direct report{(teamCount ?? 0) !== 1 ? "s" : ""}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Personal Info Editing (below org section) ── */}
      <div className="rounded-xl border border-border/40 bg-card/60 p-1">
        <div className="px-5 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Personal Contact Info</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Update your contact details and emergency information</p>
        </div>
        <ProfileForm employee={employee} />
      </div>
    </div>
  );
}
