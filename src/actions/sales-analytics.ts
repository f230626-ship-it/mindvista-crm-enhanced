"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireSalesAccess, requireSalesOwner } from "@/lib/auth";
import { todayISO, weekStart, performanceScore, sumLogs, pct } from "@/lib/sales/stats";

export async function getSalesAnalytics(filters?: {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const employee = await requireSalesAccess();
  const supabase = createAdminClient();
  const isAdmin = employee.role === "admin";

  const startDate = filters?.startDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  })();
  const endDate = filters?.endDate || todayISO();

  // Daily logs for the period
  let logsQuery = supabase
    .from("sales_daily_logs")
    .select("*, employee:employees(id, full_name)")
    .gte("log_date", startDate)
    .lte("log_date", endDate);

  if (!isAdmin) {
    logsQuery = logsQuery.eq("employee_id", employee.id);
  } else if (filters?.employeeId) {
    logsQuery = logsQuery.eq("employee_id", filters.employeeId);
  }

  const { data: logs } = await logsQuery;

  // Leads for the period
  let leadsQuery = supabase
    .from("sales_leads")
    .select("id, status, created_at")
    .gte("created_at", startDate)
    .lte("created_at", endDate + "T23:59:59");

  if (!isAdmin) {
    leadsQuery = leadsQuery.eq("employee_id", employee.id);
  } else if (filters?.employeeId) {
    leadsQuery = leadsQuery.eq("employee_id", filters.employeeId);
  }

  const { data: leads } = await leadsQuery;

  // Meetings for the period
  let meetingsQuery = supabase
    .from("sales_meetings")
    .select("id, status, meeting_date")
    .gte("meeting_date", startDate)
    .lte("meeting_date", endDate + "T23:59:59");

  if (!isAdmin) {
    meetingsQuery = meetingsQuery.eq("employee_id", employee.id);
  } else if (filters?.employeeId) {
    meetingsQuery = meetingsQuery.eq("employee_id", filters.employeeId);
  }

  const { data: meetings } = await meetingsQuery;

  // Aggregate daily data
  const dailyMap = new Map<string, {
    connections: number;
    accepted: number;
    messages: number;
    replies: number;
    followups: number;
    meetings_booked: number;
    leads: number;
  }>();

  for (const log of logs ?? []) {
    const day = log.log_date;
    if (!dailyMap.has(day)) {
      dailyMap.set(day, { connections: 0, accepted: 0, messages: 0, replies: 0, followups: 0, meetings_booked: 0, leads: 0 });
    }
    const d = dailyMap.get(day)!;
    d.connections += log.connections_sent;
    d.accepted += log.connections_accepted;
    d.messages += log.messages_sent;
    d.replies += log.replies_received;
    d.followups += log.follow_ups_done;
    d.meetings_booked += log.meetings_booked;
    d.leads += log.leads_added;
  }

  const dailyGrowth = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, totals]) => ({ date, ...totals }));

  // Aggregate totals
  const totals = (logs ?? []).reduce(
    (acc, l) => ({
      connections: acc.connections + l.connections_sent,
      accepted: acc.accepted + l.connections_accepted,
      messages: acc.messages + l.messages_sent,
      replies: acc.replies + l.replies_received,
      followups: acc.followups + l.follow_ups_done,
      meetings_booked: acc.meetings_booked + l.meetings_booked,
      leads: acc.leads + l.leads_added,
    }),
    { connections: 0, accepted: 0, messages: 0, replies: 0, followups: 0, meetings_booked: 0, leads: 0 }
  );

  // Lead pipeline
  const pipeline = {
    cold: 0,
    contacted: 0,
    replied: 0,
    interested: 0,
    meeting_booked: 0,
    closed: 0,
    lost: 0,
  };
  for (const lead of leads ?? []) {
    if (lead.status in pipeline) {
      pipeline[lead.status as keyof typeof pipeline]++;
    }
  }

  // Meeting stats
  const meetingStats = {
    total: meetings?.length ?? 0,
    pending: meetings?.filter((m) => m.status === "pending").length ?? 0,
    completed: meetings?.filter((m) => m.status === "completed").length ?? 0,
    cancelled: meetings?.filter((m) => m.status === "cancelled").length ?? 0,
  };

  // Per-employee performance
  const employeeMap = new Map<string, { name: string; totals: ReturnType<typeof sumLogs>; daysLogged: number }>();
  for (const log of logs ?? []) {
    const emp = log.employee as { id: string; full_name: string } | null;
    if (!emp) continue;
    if (!employeeMap.has(emp.id)) {
      employeeMap.set(emp.id, { name: emp.full_name, totals: sumLogs([]), daysLogged: 0 });
    }
    const e = employeeMap.get(emp.id)!;
    e.totals.connections_sent += log.connections_sent;
    e.totals.connections_accepted += log.connections_accepted;
    e.totals.messages_sent += log.messages_sent;
    e.totals.replies_received += log.replies_received;
    e.totals.follow_ups_done += log.follow_ups_done;
    e.totals.meetings_booked += log.meetings_booked;
    e.totals.leads_added += log.leads_added;
    e.totals.proposals_sent += log.proposals_sent;
  }

  const daysInPeriod = Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000));

  const employeePerformance = Array.from(employeeMap.entries()).map(([id, e]) => ({
    employeeId: id,
    name: e.name,
    ...e.totals,
    daysLogged: e.daysLogged,
    acceptanceRate: pct(e.totals.connections_accepted, e.totals.connections_sent),
    replyRate: pct(e.totals.replies_received, e.totals.messages_sent),
  }));

  return {
    period: { startDate, endDate, days: daysInPeriod },
    totals,
    dailyGrowth,
    pipeline,
    meetingStats,
    employeePerformance,
    totalLeads: leads?.length ?? 0,
  };
}

export async function getLeaderboard() {
  const employee = await requireSalesAccess();
  const supabase = createAdminClient();
  const week = weekStart();

  const [{ data: logs }, { data: targets }] = await Promise.all([
    supabase
      .from("sales_daily_logs")
      .select("*, employee:employees(id, full_name, email)")
      .gte("log_date", week),
    supabase.from("sales_targets").select("*"),
  ]);

  const employeeMap = new Map<string, {
    id: string;
    name: string;
    email: string;
    totals: ReturnType<typeof sumLogs>;
    daysLogged: Set<string>;
  }>();

  for (const log of logs ?? []) {
    const emp = log.employee as { id: string; full_name: string; email: string } | null;
    if (!emp) continue;
    if (!employeeMap.has(emp.id)) {
      employeeMap.set(emp.id, {
        id: emp.id,
        name: emp.full_name,
        email: emp.email,
        totals: sumLogs([]),
        daysLogged: new Set(),
      });
    }
    const e = employeeMap.get(emp.id)!;
    e.totals.connections_sent += log.connections_sent;
    e.totals.connections_accepted += log.connections_accepted;
    e.totals.messages_sent += log.messages_sent;
    e.totals.replies_received += log.replies_received;
    e.totals.follow_ups_done += log.follow_ups_done;
    e.totals.meetings_booked += log.meetings_booked;
    e.totals.leads_added += log.leads_added;
    e.totals.proposals_sent += log.proposals_sent;
    e.daysLogged.add(log.log_date);
  }

  const ranked = Array.from(employeeMap.values()).map((e) => {
    const target = targets?.find((t) => t.employee_id === e.id) ?? {
      connections_daily: 50,
      messages_daily: 20,
      follow_ups_daily: 10,
      meetings_weekly: 5,
    };
    const score = performanceScore(e.totals, target, e.daysLogged.size || 1);
    return {
      ...e,
      score,
      daysLogged: e.daysLogged.size,
      acceptanceRate: pct(e.totals.connections_accepted, e.totals.connections_sent),
      replyRate: pct(e.totals.replies_received, e.totals.messages_sent),
    };
  });

  const byScore = [...ranked].sort((a, b) => b.score - a.score);
  const byConnections = [...ranked].sort((a, b) => b.totals.connections_sent - a.totals.connections_sent);
  const byMeetings = [...ranked].sort((a, b) => b.totals.meetings_booked - a.totals.meetings_booked);
  const byReplyRate = [...ranked].sort((a, b) => b.replyRate - a.replyRate);
  const byAcceptance = [...ranked].sort((a, b) => b.acceptanceRate - a.acceptanceRate);

  return {
    overall: byScore,
    topPerformer: byScore[0] ?? null,
    mostConnections: byConnections[0] ?? null,
    mostMeetings: byMeetings[0] ?? null,
    highestReplyRate: byReplyRate[0] ?? null,
    highestAcceptance: byAcceptance[0] ?? null,
    weekLabel: week,
  };
}

export async function getSalesAlerts() {
  const employee = await requireSalesAccess();
  const supabase = createAdminClient();
  const today = todayISO();
  const isAdmin = employee.role === "admin";

  const alerts: {
    id: string;
    type: "warning" | "danger" | "info";
    title: string;
    message: string;
    module: string;
  }[] = [];

  if (!isAdmin) {
    // Employee alerts — only personal
    const { data: myTarget } = await supabase
      .from("sales_targets")
      .select("*")
      .eq("employee_id", employee.id)
      .maybeSingle();

    const { data: myLogsToday } = await supabase
      .from("sales_daily_logs")
      .select("id")
      .eq("employee_id", employee.id)
      .eq("log_date", today);

    if (!myLogsToday?.length) {
      alerts.push({
        id: "no-log-today",
        type: "warning",
        title: "No log today",
        message: "You haven't logged any outreach activity today.",
        module: "daily-log",
      });
    }

    // Check overdue follow-ups
    const { data: overdueLeads } = await supabase
      .from("sales_leads")
      .select("id")
      .eq("employee_id", employee.id)
      .eq("status", "contacted");

    if (overdueLeads && overdueLeads.length > 5) {
      alerts.push({
        id: "overdue-followups",
        type: "danger",
        title: "Overdue follow-ups",
        message: `You have ${overdueLeads.length} leads in "contacted" status that need follow-up.`,
        module: "leads",
      });
    }

    return { alerts, error: null };
  }

  // Admin alerts — team-wide
  // 1. Inactive profiles (no logs in 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];

  const { data: activeProfiles } = await supabase
    .from("sales_profiles")
    .select("id, name")
    .eq("is_active", true);

  const { data: recentLogs } = await supabase
    .from("sales_daily_logs")
    .select("profile_id")
    .gte("log_date", weekAgoStr);

  const activeProfileIds = new Set(recentLogs?.map((l) => l.profile_id) ?? []);
  const inactiveProfiles = activeProfiles?.filter((p) => !activeProfileIds.has(p.id)) ?? [];

  if (inactiveProfiles.length > 0) {
    alerts.push({
      id: "inactive-profiles",
      type: "warning",
      title: "Inactive profiles",
      message: `${inactiveProfiles.length} profile(s) have no logs in 7 days: ${inactiveProfiles.map((p) => p.name).join(", ")}`,
      module: "profiles",
    });
  }

  // 2. Employees below target
  const { data: allTargets } = await supabase.from("sales_targets").select("*");
  const { data: todayLogs } = await supabase
    .from("sales_daily_logs")
    .select("employee_id, connections_sent")
    .eq("log_date", today);

  const empLogs = new Map<string, number>();
  for (const log of todayLogs ?? []) {
    empLogs.set(log.employee_id, (empLogs.get(log.employee_id) ?? 0) + log.connections_sent);
  }

  const belowTarget = (allTargets ?? []).filter((t) => {
    const logged = empLogs.get(t.employee_id) ?? 0;
    return logged < t.connections_daily * 0.5;
  });

  if (belowTarget.length > 0) {
    alerts.push({
      id: "below-target",
      type: "danger",
      title: "Below target",
      message: `${belowTarget.length} rep(s) are below 50% of their daily connection target.`,
      module: "targets",
    });
  }

  // 3. Missing targets (employees with no target set)
  const { data: bdEmployees } = await supabase
    .from("employees")
    .select("id, full_name")
    .or("pm_role.eq.bd,designation.ilike.%Business Developer%,designation.ilike.%BD%")
    .eq("status", "active");

  const targetEmployeeIds = new Set(allTargets?.map((t) => t.employee_id) ?? []);
  const missingTargets = bdEmployees?.filter((e) => !targetEmployeeIds.has(e.id)) ?? [];

  if (missingTargets.length > 0) {
    alerts.push({
      id: "missing-targets",
      type: "info",
      title: "Missing targets",
      message: `${missingTargets.length} BD employee(s) have no targets set: ${missingTargets.map((e) => e.full_name).join(", ")}`,
      module: "targets",
    });
  }

  // 4. Failed sync (placeholder — would check sync job status)
  // This is a placeholder for when Google Sheets sync is implemented

  // 5. Overdue follow-ups (team-wide)
  const { data: overdueTeamLeads } = await supabase
    .from("sales_leads")
    .select("id, employee_id, employee:employees(full_name)")
    .eq("status", "contacted");

  if (overdueTeamLeads && overdueTeamLeads.length > 10) {
    alerts.push({
      id: "team-overdue-followups",
      type: "danger",
      title: "Team overdue follow-ups",
      message: `${overdueTeamLeads.length} leads across the team are in "contacted" status without reply.`,
      module: "leads",
    });
  }

  return { alerts, error: null };
}
