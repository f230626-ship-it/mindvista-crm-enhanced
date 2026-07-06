import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, TrendingUp, Users, Target, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import { LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildHierarchyTree, getTeamHierarchy } from "@/lib/hierarchy";
import { getPendingLeavesForLead } from "@/actions/leaves";
import { PendingLeaveApprovals } from "@/components/leave/pending-approvals";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { StatsCards } from "@/components/dashboard/stats-cards";

export default async function DashboardPage() {
  const employee = await requireAuth();
  const supabase = await createClient();

  const [
    { data: leaveBalance },
    { data: recentLeaves },
    { data: assignedAssets },
    { data: allEmployees },
    { data: allLeaves },
    { data: teamPerformance },
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
    supabase.from("employees").select("id, status, created_at").eq("status", "active"),
    supabase.from("leaves").select("id, leave_type, status, created_at, days_count").gte("created_at", new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from("performance_goals").select("id, completion_status, employee_id"),
    getTeamHierarchy(employee.id),
    getPendingLeavesForLead(),
  ]);

  const teamSize = hierarchy.directReports.length + hierarchy.leadTeam.length;

  const annualRemaining = (leaveBalance?.annual_quota ?? 0) - (leaveBalance?.annual_used ?? 0);
  const sickRemaining = (leaveBalance?.sick_quota ?? 0) - (leaveBalance?.sick_used ?? 0);
  const casualRemaining = (leaveBalance?.casual_quota ?? 0) - (leaveBalance?.casual_used ?? 0);

  // Analytics data
  const totalEmployees = allEmployees?.length ?? 0;
  const totalAssets = assignedAssets?.length ?? 0;
  const pendingLeaves = allLeaves?.filter(l => l.status === 'pending')?.length ?? 0;
  const avgPerformance = teamPerformance?.length ? 
    (teamPerformance.reduce((acc, p) => acc + p.completion_status, 0) / teamPerformance.length) : 0;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {employee.full_name} 
              {employee.employee_code && (
                <Badge variant="outline" className="ml-2 font-mono text-xs">
                  #{employee.employee_code}
                </Badge>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards
        totalEmployees={totalEmployees}
        totalAssets={totalAssets}
        pendingLeaves={pendingLeaves}
        avgPerformance={avgPerformance}
        teamSize={teamSize}
        isManager={employee.role === 'admin' || employee.role === 'manager'}
      />

      {/* Pending Approvals Alert */}
      {pendingForLead.length > 0 && (
        <Card className="border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <Bell className="h-5 w-5" />
              {pendingForLead.length} Leave Request{pendingForLead.length > 1 ? 's' : ''} Need Your Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PendingLeaveApprovals leaves={pendingForLead} />
          </CardContent>
        </Card>
      )}

      {/* Charts and Analytics */}
      <DashboardCharts
        leaveBalance={leaveBalance}
        recentLeaves={allLeaves ?? []}
        teamPerformance={teamPerformance ?? []}
        isManager={employee.role === 'admin' || employee.role === 'manager'}
      />

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Leave Requests */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-primary" />
                Recent Leave Requests
              </CardTitle>
              <Link href="/leave" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentLeaves && recentLeaves.length > 0 ? (
              <div className="divide-y divide-border">
                {recentLeaves.slice(0, 5).map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-medium">{LEAVE_TYPE_LABELS[leave.leave_type]}</p>
                      <p className="text-sm text-muted-foreground">
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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">No leave requests yet</p>
                <Link href="/leave" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2")}>
                  Apply for Leave
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned Assets */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              My Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {assignedAssets && assignedAssets.length > 0 ? (
              <div className="divide-y divide-border">
                {assignedAssets.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-medium">{a.asset?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Serial: {a.asset?.serial_number ?? "Not specified"}
                      </p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                ))}
                <div className="p-4">
                  <Link href="/assets" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}>
                    View All Assets
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">No assets assigned</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leave Balance Progress */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Leave Balance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { 
                label: "Annual Leave", 
                remaining: annualRemaining, 
                total: leaveBalance?.annual_quota ?? 0,
                color: "bg-blue-500",
                bgColor: "bg-blue-100 dark:bg-blue-900/20"
              },
              { 
                label: "Sick Leave", 
                remaining: sickRemaining, 
                total: leaveBalance?.sick_quota ?? 0,
                color: "bg-red-500",
                bgColor: "bg-red-100 dark:bg-red-900/20"
              },
              { 
                label: "Casual Leave", 
                remaining: casualRemaining, 
                total: leaveBalance?.casual_quota ?? 0,
                color: "bg-green-500",
                bgColor: "bg-green-100 dark:bg-green-900/20"
              },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-4 ${item.bgColor}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{item.label}</h3>
                  <span className="text-2xl font-bold">
                    {item.remaining}<span className="text-sm font-normal text-muted-foreground">/{item.total}</span>
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Remaining</span>
                    <span>{Math.round((item.remaining / (item.total || 1)) * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/60 dark:bg-black/20 overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all duration-500`}
                      style={{ width: `${item.total ? (item.remaining / item.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
