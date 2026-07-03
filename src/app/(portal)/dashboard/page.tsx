import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import { LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildHierarchyTree, getTeamHierarchy } from "@/lib/hierarchy";
import { getPendingLeavesForLead } from "@/actions/leaves";
import { PendingLeaveApprovals } from "@/components/leave/pending-approvals";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const employee = await requireAuth();
  const supabase = await createClient();

  const [
    { data: leaveBalance },
    { data: recentLeaves },
    { data: assignedAssets },
    hierarchy,
    pendingForLead,
  ] = await Promise.all([
    supabase.from("leave_balances").select("*").eq("employee_id", employee.id).maybeSingle(),
    supabase
      .from("leaves")
      .select("*")
      .eq("employee_id", employee.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("asset_assignments")
      .select("*, asset:assets(*)")
      .eq("employee_id", employee.id)
      .is("return_date", null),
    getTeamHierarchy(employee.id),
    getPendingLeavesForLead(),
  ]);

  const hierarchyTree = buildHierarchyTree(hierarchy.all, employee.id);
  const teamSize = hierarchy.directReports.length + hierarchy.leadTeam.length;

  const annualRemaining = (leaveBalance?.annual_quota ?? 0) - (leaveBalance?.annual_used ?? 0);
  const sickRemaining = (leaveBalance?.sick_quota ?? 0) - (leaveBalance?.sick_used ?? 0);
  const casualRemaining = (leaveBalance?.casual_quota ?? 0) - (leaveBalance?.casual_used ?? 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {employee.employee_code
            ? `${employee.full_name} · ${employee.employee_code}`
            : employee.full_name}
        </p>
      </div>

      {/* Clickable Stat Cards — handled by client component */}
      <DashboardClient
        leaveBalance={leaveBalance}
        recentLeaves={recentLeaves}
        assignedAssets={assignedAssets}
        hierarchyTree={hierarchyTree}
        teamSize={teamSize}
        annualRemaining={annualRemaining}
        sickRemaining={sickRemaining}
      />

      {pendingForLead.length > 0 && (
        <Card className="mt-6 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-primary" />
              Leave Approvals Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PendingLeaveApprovals leaves={pendingForLead} />
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Leave Requests</CardTitle>
            <Link href="/leave" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentLeaves && recentLeaves.length > 0 ? (
              <div className="space-y-3">
                {recentLeaves.slice(0, 5).map((leave) => (
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
            <CardTitle className="text-base">Assigned Assets</CardTitle>
          </CardHeader>
          <CardContent>
            {assignedAssets && assignedAssets.length > 0 ? (
              <div className="space-y-2">
                {assignedAssets.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <span className="font-medium">{a.asset?.name}</span>
                    <span className="text-muted-foreground">{a.asset?.serial_number ?? "—"}</span>
                  </div>
                ))}
                <Link href="/assets" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2 w-full")}>
                  View all assets
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No assets assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
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
  );
}
