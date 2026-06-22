import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Package, Users } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import { LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";
import { isManagerOrAdmin } from "@/lib/auth";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const employee = await requireAuth();
  const supabase = await createClient();

  const [
    { data: leaveBalance },
    { data: recentLeaves },
    { data: todayAttendance },
    { data: assignedAssets },
    { count: pendingLeaves },
    { count: totalEmployees },
  ] = await Promise.all([
    supabase.from("leave_balances").select("*").eq("employee_id", employee.id).maybeSingle(),
    supabase
      .from("leaves")
      .select("*")
      .eq("employee_id", employee.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", employee.id)
      .eq("date", new Date().toISOString().split("T")[0])
      .maybeSingle(),
    supabase
      .from("asset_assignments")
      .select("*, asset:assets(*)")
      .eq("employee_id", employee.id)
      .is("return_date", null),
    isManagerOrAdmin(employee.role)
      ? supabase.from("leaves").select("*", { count: "exact", head: true }).eq("status", "pending")
      : Promise.resolve({ count: 0 }),
    isManagerOrAdmin(employee.role)
      ? supabase.from("employees").select("*", { count: "exact", head: true }).eq("status", "active")
      : Promise.resolve({ count: 0 }),
  ]);

  const annualRemaining = (leaveBalance?.annual_quota ?? 0) - (leaveBalance?.annual_used ?? 0);
  const sickRemaining = (leaveBalance?.sick_quota ?? 0) - (leaveBalance?.sick_used ?? 0);
  const casualRemaining = (leaveBalance?.casual_quota ?? 0) - (leaveBalance?.casual_used ?? 0);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Overview for ${employee.full_name}`}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Annual Leave"
          value={annualRemaining}
          description={`${leaveBalance?.annual_used ?? 0} used of ${leaveBalance?.annual_quota ?? 0}`}
          icon={CalendarDays}
          delay={0}
        />
        <StatCard
          title="Sick Leave"
          value={sickRemaining}
          description={`${leaveBalance?.sick_used ?? 0} used of ${leaveBalance?.sick_quota ?? 0}`}
          icon={CalendarDays}
          delay={60}
        />
        <StatCard
          title="Today's Status"
          value={todayAttendance?.check_in ? (todayAttendance.check_out ? "Done" : "Working") : "Not In"}
          description={
            todayAttendance?.check_in
              ? `Checked in at ${formatDate(todayAttendance.check_in, "h:mm a")}`
              : "No check-in yet"
          }
          icon={Clock}
          delay={120}
        />
        <StatCard
          title="Assigned Assets"
          value={assignedAssets?.length ?? 0}
          description="Company equipment"
          icon={Package}
          delay={180}
        />
      </div>

      {isManagerOrAdmin(employee.role) && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <StatCard
            title="Pending Leaves"
            value={pendingLeaves ?? 0}
            description="Awaiting approval"
            icon={CalendarDays}
          />
          <StatCard
            title="Active Employees"
            value={totalEmployees ?? 0}
            description="Across all departments"
            icon={Users}
          />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Leave Requests</CardTitle>
            <Link
              href="/leave"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentLeaves && recentLeaves.length > 0 ? (
              <div className="space-y-3">
                {recentLeaves.map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{LEAVE_TYPE_LABELS[leave.leave_type]}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(leave.start_date)} – {formatDate(leave.end_date)} ({leave.days_count}d)
                      </p>
                    </div>
                    <Badge className={STATUS_COLORS[leave.status]} variant="secondary">
                      {LEAVE_STATUS_LABELS[leave.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No leave requests yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leave Balance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Annual", remaining: annualRemaining, total: leaveBalance?.annual_quota ?? 0 },
              { label: "Sick", remaining: sickRemaining, total: leaveBalance?.sick_quota ?? 0 },
              { label: "Casual", remaining: casualRemaining, total: leaveBalance?.casual_quota ?? 0 },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="text-muted-foreground">
                    {item.remaining} / {item.total} remaining
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${item.total ? (item.remaining / item.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
