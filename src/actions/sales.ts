"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee, requireSalesOwner, requireSalesAccess } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { todayISO, weekStart, sumLogs, performanceScore } from "@/lib/sales/stats";

export async function submitDailyLog(formData: FormData) {
  const employee = await requireSalesAccess();
  const supabase = await createClient();

  const profileId = formData.get("profile_id") as string;
  const logDate = (formData.get("log_date") as string) || todayISO();

  if (!profileId) return { error: "Profile ID is required" };

  const safeInt = (val: string | null, min = 0, max = 99999) => {
    const n = parseInt(val ?? "", 10) || 0;
    return Math.max(min, Math.min(max, n));
  };

  const payload = {
    employee_id: employee.id,
    profile_id: profileId,
    log_date: logDate,
    connections_sent: safeInt(formData.get("connections_sent") as string, 0, 9999),
    connections_accepted: safeInt(formData.get("connections_accepted") as string, 0, 9999),
    messages_sent: safeInt(formData.get("messages_sent") as string, 0, 9999),
    replies_received: safeInt(formData.get("replies_received") as string, 0, 9999),
    follow_ups_done: safeInt(formData.get("follow_ups_done") as string, 0, 9999),
    meetings_booked: safeInt(formData.get("meetings_booked") as string, 0, 9999),
    leads_added: safeInt(formData.get("leads_added") as string, 0, 9999),
    proposals_sent: safeInt(formData.get("proposals_sent") as string, 0, 9999),
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

  const name = (formData.get("name") as string)?.trim();
  const employeeId = formData.get("employee_id") as string;

  if (!name) return { error: "Profile name is required" };
  if (!employeeId) return { error: "Select an employee for this profile" };

  const { error } = await supabase.from("sales_profiles").insert({
    name,
    employee_id: employeeId,
    platform: (formData.get("platform") as string) || "linkedin",
    google_sheet_id: (formData.get("google_sheet_id") as string) || null,
    sheet_tab_name: (formData.get("sheet_tab_name") as string) || null,
    is_active: formData.get("is_active") !== "false",
    linkedin_email: (formData.get("linkedin_email") as string) || null,
    linkedin_username: (formData.get("linkedin_username") as string) || null,
    linkedin_url: (formData.get("linkedin_url") as string) || null,
    assigned_team_id: (formData.get("assigned_team_id") as string) || null,
    notes: (formData.get("notes") as string) || null,
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
      name: (formData.get("name") as string)?.trim(),
      employee_id: formData.get("employee_id") as string,
      platform: (formData.get("platform") as string) || "linkedin",
      google_sheet_id: (formData.get("google_sheet_id") as string) || null,
      sheet_tab_name: (formData.get("sheet_tab_name") as string) || null,
      is_active: formData.get("is_active") === "true",
      linkedin_email: (formData.get("linkedin_email") as string) || null,
      linkedin_username: (formData.get("linkedin_username") as string) || null,
      linkedin_url: (formData.get("linkedin_url") as string) || null,
      assigned_team_id: (formData.get("assigned_team_id") as string) || null,
      notes: (formData.get("notes") as string) || null,
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
  if (!employeeId) return { error: "Employee ID is required" };

  const safeInt = (val: string | null, min = 0, max = 9999) => {
    const n = parseInt(val ?? "", 10) || 0;
    return Math.max(min, Math.min(max, n));
  };

  const { error } = await supabase.from("sales_targets").upsert(
    {
      employee_id: employeeId,
      connections_daily: safeInt(formData.get("connections_daily") as string, 1, 500),
      messages_daily: safeInt(formData.get("messages_daily") as string, 1, 500),
      follow_ups_daily: safeInt(formData.get("follow_ups_daily") as string, 1, 500),
      meetings_weekly: safeInt(formData.get("meetings_weekly") as string, 1, 100),
      monthly_goal: safeInt(formData.get("monthly_goal") as string, 0, 100000),
      updated_by: employeeId,
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

export async function testProfileSheetConnection(profileId: string): Promise<{ success?: boolean; error?: string; preview?: string[][] }> {
  await requireSalesOwner();
  const supabase = await createAdminClient();

  const { data: profile, error } = await supabase
    .from("sales_profiles")
    .select("google_sheet_id, sheet_tab_name, name")
    .eq("id", profileId)
    .single();

  if (error || !profile) return { error: "Profile not found" };
  if (!profile.google_sheet_id)
    return { error: "No Google Sheet ID configured for this profile" };

  const { testSheetAccess } = await import("@/lib/google/sheets");
  return testSheetAccess(
    profile.google_sheet_id,
    profile.sheet_tab_name ?? undefined
  );
}

export async function fetchAndSyncProfileSheet(profileId: string) {
  await requireSalesOwner();
  const supabase = await createAdminClient();

  const { data: profile, error } = await supabase
    .from("sales_profiles")
    .select("google_sheet_id, sheet_tab_name, name")
    .eq("id", profileId)
    .single();

  if (error || !profile) return { error: "Profile not found" };
  if (!profile.google_sheet_id)
    return { error: "No Google Sheet ID configured for this profile" };

  const { fetchSheetData } = await import("@/lib/google/sheets");
  const sheetData = await fetchSheetData(
    profile.google_sheet_id,
    profile.sheet_tab_name ?? ""
  );

  const { error: upsertError } = await supabase
    .from("sales_sheet_snapshots")
    .upsert(
      {
        profile_id: profileId,
        snapshot_date: todayISO(),
        active_leads: sheetData.active_leads,
        follow_up: sheetData.follow_up,
        intro_call: sheetData.intro_call,
        trying_to_call: sheetData.trying_to_call,
        won_mtd: sheetData.won_mtd,
        status_breakdown: sheetData.status_breakdown,
      },
      { onConflict: "profile_id,snapshot_date" }
    );

  if (upsertError) return { error: upsertError.message };

  revalidatePath("/sales/command");
  return {
    success: true,
    data: sheetData,
    profileName: profile.name,
  };
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
    supabase.from("sales_daily_logs").select("*, employee:employees(id, full_name, email)").gte("log_date", week).limit(500),
    supabase.from("sales_profiles").select("*, employee:employees(id, full_name, email)").eq("is_active", true).order("name").limit(100),
    supabase.from("sales_sheet_snapshots").select("*, profile:sales_profiles(id, name, employee_id)").eq("snapshot_date", today).limit(100),
    supabase.from("sales_targets").select("*").limit(100),
    supabase.from("employees").select("id, full_name, email, designation").eq("status", "active").limit(100),
  ]);

  const todayLogs = logs?.filter((l) => l.log_date === today) ?? [];
  const teamToday = sumLogs(todayLogs);

  // Filter for Business Developers by designation
  const bdReps = (reps ?? []).filter(rep => {
    const d = (rep.designation || "").toLowerCase();
    return d.includes("business developer") || d.includes("bd");
  });

  const repStats = bdReps.map((rep) => {
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
    supabase.from("sales_daily_logs").select("*, profile:sales_profiles(name)").eq("employee_id", employee.id).gte("log_date", week).order("log_date").limit(100),
    supabase.from("sales_targets").select("*").eq("employee_id", employee.id).maybeSingle(),
    supabase.from("sales_profiles").select("id, name").eq("employee_id", employee.id).eq("is_active", true).limit(50),
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

export async function deleteSalesProfile(profileId: string) {
  await requireSalesOwner();
  const supabase = await createClient();
  const { error } = await supabase.from("sales_profiles").delete().eq("id", profileId);
  if (error) return { error: error.message };
  revalidatePath("/sales/admin/profiles");
  revalidatePath("/sales/command");
  return { success: true };
}

export async function deleteSalesTarget(targetId: string) {
  await requireSalesOwner();
  const supabase = await createClient();
  const { error } = await supabase.from("sales_targets").delete().eq("id", targetId);
  if (error) return { error: error.message };
  revalidatePath("/sales/admin/targets");
  revalidatePath("/sales/command");
  return { success: true };
}

export async function getLogHistory(filters?: { employeeId?: string; startDate?: string; endDate?: string }) {
  const employee = await requireSalesAccess();
  const supabase = createAdminClient();
  const isAdmin = employee.role === "admin";

  let query = supabase
    .from("sales_daily_logs")
    .select("*, profile:sales_profiles(name, platform), employee:employees(full_name)")
    .order("log_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    query = query.eq("employee_id", employee.id);
  } else if (filters?.employeeId) {
    query = query.eq("employee_id", filters.employeeId);
  }

  if (filters?.startDate) {
    query = query.gte("log_date", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("log_date", filters.endDate);
  }

  const { data, error } = await query.limit(200);
  if (error) return { logs: [], error: error.message };
  return { logs: data ?? [], error: null };
}

export async function getCommandCenterDataWithSnapshots() {
  await requireSalesOwner();
  const supabase = createAdminClient();
  const today = todayISO();
  const week = weekStart();

  const [
    { data: logs },
    { data: profiles },
    { data: snapshots },
    { data: targets },
    { data: reps },
  ] = await Promise.all([
    supabase.from("sales_daily_logs").select("*, employee:employees(id, full_name, email)").gte("log_date", week).limit(500),
    supabase.from("sales_profiles").select("*, employee:employees(id, full_name, email)").eq("is_active", true).order("name").limit(100),
    supabase.from("sales_sheet_snapshots").select("*, profile:sales_profiles(id, name, employee_id)").eq("snapshot_date", today).limit(100),
    supabase.from("sales_targets").select("*").limit(100),
    supabase.from("employees").select("id, full_name, email, designation").eq("status", "active").limit(100),
  ]);

  const todayLogs = logs?.filter((l) => l.log_date === today) ?? [];
  const teamToday = sumLogs(todayLogs);

  // Filter for Business Developers by designation
  const bdReps = (reps ?? []).filter(rep => {
    const d = (rep.designation || "").toLowerCase();
    return d.includes("business developer") || d.includes("bd");
  });

  const repStats = bdReps.map((rep) => {
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

  const profilesWithSnapshots = (profiles ?? []).map((p) => ({
    ...p,
    snapshot: snapshots?.find((s) => s.profile_id === p.id) ?? null,
  }));

  return {
    teamToday,
    repStats,
    profiles: profilesWithSnapshots,
    snapshots: snapshots ?? [],
    targets: targets ?? [],
  };
}

export async function getWeeklyReportData() {
  await requireSalesOwner();
  const supabase = await createClient();
  const week = weekStart();

  const { data: logs } = await supabase
    .from("sales_daily_logs")
    .select("*, employee:employees(full_name)")
    .gte("log_date", week)
    .limit(500);

  const { data: snapshots } = await supabase
    .from("sales_sheet_snapshots")
    .select("active_leads, won_mtd")
    .eq("snapshot_date", todayISO())
    .limit(100);

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
