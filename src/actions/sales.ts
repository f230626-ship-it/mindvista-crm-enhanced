"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee, requireSalesOwner, requireSalesAccess } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { todayISO, weekStart, sumLogs, performanceScore } from "@/lib/sales/stats";

export async function submitDailyLog(formData: FormData) {
  const employee = await requireSalesAccess();
  const supabase = await createClient();

  const profileId = formData.get("profile_id") as string;
  const logDate = (formData.get("log_date") as string) || todayISO();

  const payload = {
    employee_id: employee.id,
    profile_id: profileId,
    log_date: logDate,
    connections_sent: parseInt(formData.get("connections_sent") as string, 10) || 0,
    connections_accepted: parseInt(formData.get("connections_accepted") as string, 10) || 0,
    messages_sent: parseInt(formData.get("messages_sent") as string, 10) || 0,
    replies_received: parseInt(formData.get("replies_received") as string, 10) || 0,
    follow_ups_done: parseInt(formData.get("follow_ups_done") as string, 10) || 0,
    meetings_booked: parseInt(formData.get("meetings_booked") as string, 10) || 0,
    leads_added: parseInt(formData.get("leads_added") as string, 10) || 0,
    proposals_sent: parseInt(formData.get("proposals_sent") as string, 10) || 0,
    notes: (formData.get("notes") as string) || null,
  };

  const { error } = await supabase.from("sales_daily_logs").upsert(payload, {
    onConflict: "profile_id,log_date",
  });

  if (error) return { error: error.message };

  revalidatePath("/sales/my-day");
  revalidatePath("/sales/my-progress");
  revalidatePath("/sales/command");
  return { success: true };
}

export async function createSalesProfile(formData: FormData) {
  await requireSalesOwner();
  const supabase = await createClient();

  const { error } = await supabase.from("sales_profiles").insert({
    name: formData.get("name") as string,
    employee_id: formData.get("employee_id") as string,
    platform: (formData.get("platform") as string) || "linkedin",
    google_sheet_id: (formData.get("google_sheet_id") as string) || null,
    sheet_tab_name: (formData.get("sheet_tab_name") as string) || null,
    is_active: formData.get("is_active") !== "false",
  });

  if (error) return { error: error.message };

  revalidatePath("/sales/admin/profiles");
  revalidatePath("/sales/command");
  return { success: true };
}

export async function updateSalesProfile(profileId: string, formData: FormData) {
  await requireSalesOwner();
  const supabase = await createClient();

  const { error } = await supabase
    .from("sales_profiles")
    .update({
      name: formData.get("name") as string,
      employee_id: formData.get("employee_id") as string,
      platform: (formData.get("platform") as string) || "linkedin",
      google_sheet_id: (formData.get("google_sheet_id") as string) || null,
      sheet_tab_name: (formData.get("sheet_tab_name") as string) || null,
      is_active: formData.get("is_active") === "true",
    })
    .eq("id", profileId);

  if (error) return { error: error.message };

  revalidatePath("/sales/admin/profiles");
  revalidatePath(`/sales/admin/profiles/${profileId}`);
  revalidatePath("/sales/command");
  return { success: true };
}

export async function upsertSalesTarget(formData: FormData) {
  await requireSalesOwner();
  const supabase = await createClient();

  const employeeId = formData.get("employee_id") as string;
  const { error } = await supabase.from("sales_targets").upsert(
    {
      employee_id: employeeId,
      connections_daily: parseInt(formData.get("connections_daily") as string, 10) || 50,
      messages_daily: parseInt(formData.get("messages_daily") as string, 10) || 20,
      follow_ups_daily: parseInt(formData.get("follow_ups_daily") as string, 10) || 10,
      meetings_weekly: parseInt(formData.get("meetings_weekly") as string, 10) || 5,
    },
    { onConflict: "employee_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/sales/admin/targets");
  revalidatePath("/sales/command");
  return { success: true };
}

export async function upsertSheetSnapshot(profileId: string, data: {
  active_leads: number;
  follow_up?: number;
  intro_call?: number;
  trying_to_call?: number;
  won_mtd?: number;
}) {
  await requireSalesOwner();
  const supabase = await createClient();

  const { error } = await supabase.from("sales_sheet_snapshots").upsert(
    {
      profile_id: profileId,
      snapshot_date: todayISO(),
      active_leads: data.active_leads,
      follow_up: data.follow_up ?? 0,
      intro_call: data.intro_call ?? 0,
      trying_to_call: data.trying_to_call ?? 0,
      won_mtd: data.won_mtd ?? 0,
    },
    { onConflict: "profile_id,snapshot_date" }
  );

  if (error) return { error: error.message };
  revalidatePath("/sales/command");
  return { success: true };
}

export async function getMyProfiles() {
  const employee = await getCurrentEmployee();
  if (!employee) return [];
  const supabase = await createClient();

  const { data } = await supabase
    .from("sales_profiles")
    .select("*")
    .eq("employee_id", employee.id)
    .eq("is_active", true)
    .order("name");

  return data ?? [];
}

export async function getProfileLogForToday(profileId: string) {
  const employee = await getCurrentEmployee();
  if (!employee) return null;
  const supabase = await createClient();

  const { data } = await supabase
    .from("sales_daily_logs")
    .select("*")
    .eq("profile_id", profileId)
    .eq("log_date", todayISO())
    .maybeSingle();

  return data;
}

export async function getCommandCenterData() {
  await requireSalesOwner();
  const supabase = await createClient();
  const today = todayISO();
  const week = weekStart();

  const [
    { data: logs },
    { data: profiles },
    { data: snapshots },
    { data: targets },
    { data: reps },
  ] = await Promise.all([
    supabase.from("sales_daily_logs").select("*, employee:employees(id, full_name, email)").gte("log_date", week),
    supabase.from("sales_profiles").select("*, employee:employees(id, full_name, email)").eq("is_active", true).order("name"),
    supabase.from("sales_sheet_snapshots").select("*, profile:sales_profiles(id, name, employee_id)").eq("snapshot_date", today),
    supabase.from("sales_targets").select("*"),
    supabase.from("employees").select("id, full_name, email, pm_role").eq("pm_role", "bd").eq("status", "active"),
  ]);

  const todayLogs = logs?.filter((l) => l.log_date === today) ?? [];
  const teamToday = sumLogs(todayLogs);

  const repStats = (reps ?? []).map((rep) => {
    const repWeekLogs = logs?.filter((l) => l.employee_id === rep.id) ?? [];
    const repToday = logs?.find((l) => l.employee_id === rep.id && l.log_date === today);
    const target = targets?.find((t) => t.employee_id === rep.id) ?? {
      connections_daily: 50,
      messages_daily: 20,
      follow_ups_daily: 10,
      meetings_weekly: 5,
    };
    const weekTotals = sumLogs(repWeekLogs);
    const daysLogged = new Set(repWeekLogs.map((l) => l.log_date)).size;

    return {
      ...rep,
      target,
      weekTotals,
      todayLogged: !!repToday,
      todayTotals: repToday ? sumLogs([repToday]) : null,
      score: performanceScore(weekTotals, target, daysLogged || 1),
      connectionsPct: target.connections_daily
        ? Math.round(((repToday?.connections_sent ?? 0) / target.connections_daily) * 100)
        : 0,
    };
  });

  return {
    teamToday,
    repStats,
    profiles: profiles ?? [],
    snapshots: snapshots ?? [],
    targets: targets ?? [],
  };
}

export async function getMyProgressData() {
  const employee = await requireSalesAccess();
  const supabase = await createClient();
  const week = weekStart();
  const today = todayISO();

  const [{ data: logs }, { data: target }, { data: profiles }] = await Promise.all([
    supabase.from("sales_daily_logs").select("*, profile:sales_profiles(name)").eq("employee_id", employee.id).gte("log_date", week).order("log_date"),
    supabase.from("sales_targets").select("*").eq("employee_id", employee.id).maybeSingle(),
    supabase.from("sales_profiles").select("id, name").eq("employee_id", employee.id).eq("is_active", true),
  ]);

  const profileIds = profiles?.map((p) => p.id) ?? [];
  const { data: snapshots } = profileIds.length
    ? await supabase.from("sales_sheet_snapshots").select("*").in("profile_id", profileIds).eq("snapshot_date", today)
    : { data: [] };

  const t = target ?? { connections_daily: 50, messages_daily: 20, follow_ups_daily: 10, meetings_weekly: 5 };
  const weekTotals = sumLogs(logs ?? []);
  const daysLogged = new Set(logs?.map((l) => l.log_date) ?? []).size;
  const score = performanceScore(weekTotals, t, daysLogged || 1);

  const chartData = (logs ?? []).reduce<Record<string, typeof weekTotals>>((acc, log) => {
    if (!acc[log.log_date]) {
      acc[log.log_date] = sumLogs([]);
    }
    const day = acc[log.log_date];
    day.connections_sent += log.connections_sent;
    day.messages_sent += log.messages_sent;
    day.meetings_booked += log.meetings_booked;
    return acc;
  }, {});

  const trend = Object.entries(chartData).map(([date, totals]) => ({
    date,
    connections: totals.connections_sent,
    messages: totals.messages_sent,
    meetings: totals.meetings_booked,
  }));

  return { weekTotals, target: t, score, trend, profiles: profiles ?? [], snapshots: snapshots ?? [], logs: logs ?? [] };
}

export async function getWeeklyReportData() {
  await requireSalesOwner();
  const supabase = await createClient();
  const week = weekStart();

  const { data: logs } = await supabase
    .from("sales_daily_logs")
    .select("*, employee:employees(full_name)")
    .gte("log_date", week);

  const { data: snapshots } = await supabase
    .from("sales_sheet_snapshots")
    .select("active_leads, won_mtd")
    .eq("snapshot_date", todayISO());

  const totals = sumLogs(logs ?? []);
  const activeLeads = snapshots?.reduce((s, x) => s + x.active_leads, 0) ?? 0;
  const wonMtd = snapshots?.reduce((s, x) => s + x.won_mtd, 0) ?? 0;

  const byRep = new Map<string, { name: string; meetings: number; connections: number }>();
  for (const log of logs ?? []) {
    const name = (log.employee as { full_name: string })?.full_name ?? "Unknown";
    const cur = byRep.get(log.employee_id) ?? { name, meetings: 0, connections: 0 };
    cur.meetings += log.meetings_booked;
    cur.connections += log.connections_sent;
    byRep.set(log.employee_id, cur);
  }

  const ranked = [...byRep.values()].sort((a, b) => b.meetings - a.meetings || b.connections - a.connections);
  const top = ranked[0]?.name ?? "—";
  const needsAttention = ranked[ranked.length - 1]?.name ?? "—";

  return {
    totals,
    activeLeads,
    wonMtd,
    replyRate: totals.messages_sent ? Math.round((totals.replies_received / totals.messages_sent) * 100) : 0,
    acceptanceRate: totals.connections_sent ? Math.round((totals.connections_accepted / totals.connections_sent) * 100) : 0,
    topPerformer: top,
    needsAttention: ranked.length > 1 ? needsAttention : "—",
    weekLabel: week,
  };
}
