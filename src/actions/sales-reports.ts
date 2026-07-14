"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireSalesOwner } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { todayISO, weekStart, sumLogs, pct, performanceScore } from "@/lib/sales/stats";

export async function generateWeeklyReport() {
  await requireSalesOwner();
  const supabase = createAdminClient();
  const week = weekStart();

  // Check if report already exists for this week
  const { data: existing } = await supabase
    .from("weekly_reports")
    .select("id")
    .eq("week_start", week)
    .maybeSingle();

  if (existing) return { error: "Report already exists for this week", reportId: existing.id };

  // Gather data
  const [{ data: logs }, { data: targets }, { data: leads }, { data: meetings }] = await Promise.all([
    supabase
      .from("sales_daily_logs")
      .select("*, employee:employees(id, full_name)")
      .gte("log_date", week),
    supabase.from("sales_targets").select("*"),
    supabase.from("sales_leads").select("id, status, created_at").gte("created_at", week),
    supabase.from("sales_meetings").select("id, status").gte("meeting_date", week),
  ]);

  const totals = sumLogs(logs ?? []);
  const totalLeads = leads?.length ?? 0;

  // Per-rep performance
  const repMap = new Map<string, { name: string; totals: ReturnType<typeof sumLogs>; daysLogged: Set<string> }>();
  for (const log of logs ?? []) {
    const emp = log.employee as { id: string; full_name: string } | null;
    if (!emp) continue;
    if (!repMap.has(emp.id)) {
      repMap.set(emp.id, { name: emp.full_name, totals: sumLogs([]), daysLogged: new Set() });
    }
    const r = repMap.get(emp.id)!;
    r.totals.connections_sent += log.connections_sent;
    r.totals.connections_accepted += log.connections_accepted;
    r.totals.messages_sent += log.messages_sent;
    r.totals.replies_received += log.replies_received;
    r.totals.follow_ups_done += log.follow_ups_done;
    r.totals.meetings_booked += log.meetings_booked;
    r.totals.leads_added += log.leads_added;
    r.totals.proposals_sent += log.proposals_sent;
    r.daysLogged.add(log.log_date);
  }

  const ranked = Array.from(repMap.entries()).map(([id, r]) => {
    const target = targets?.find((t) => t.employee_id === id) ?? {
      connections_daily: 50,
      messages_daily: 20,
      follow_ups_daily: 10,
      meetings_weekly: 5,
    };
    return {
      id,
      name: r.name,
      score: performanceScore(r.totals, target, r.daysLogged.size || 1),
      totals: r.totals,
    };
  }).sort((a, b) => b.score - a.score);

  const topPerformerId = ranked[0]?.id ?? null;
  const needsAttentionId = ranked.length > 1 ? ranked[ranked.length - 1]?.id ?? null : null;

  // Pipeline summary
  const pipelineSummary: Record<string, number> = {
    cold: 0,
    contacted: 0,
    replied: 0,
    interested: 0,
    meeting_booked: 0,
    closed: 0,
    lost: 0,
  };
  for (const lead of leads ?? []) {
    if (lead.status in pipelineSummary) {
      pipelineSummary[lead.status]++;
    }
  }

  // Generate recommendations
  const recommendations: string[] = [];
  if (totals.connections_sent < 100) {
    recommendations.push("Team connection volume is low. Consider increasing daily targets or adding more profiles.");
  }
  if (totals.messages_sent > 0 && pct(totals.replies_received, totals.messages_sent) < 10) {
    recommendations.push("Reply rate is below 10%. Review message templates and personalization.");
  }
  if (totals.meetings_booked === 0) {
    recommendations.push("No meetings booked this week. Focus on converting interested leads.");
  }
  if (ranked.length > 0 && ranked[ranked.length - 1].score < 50) {
    recommendations.push(`${ranked[ranked.length - 1].name} needs coaching — performance score below 50.`);
  }
  if (pipelineSummary.interested > 5) {
    recommendations.push(`${pipelineSummary.interested} leads are interested. Schedule meetings quickly to avoid losing momentum.`);
  }

  const { data: report, error } = await supabase
    .from("weekly_reports")
    .insert({
      week_start: week,
      total_connections: totals.connections_sent,
      total_messages: totals.messages_sent,
      total_replies: totals.replies_received,
      total_meetings: totals.meetings_booked,
      total_leads: totalLeads,
      total_followups: totals.follow_ups_done,
      conversion_rate: totalLeads > 0 ? pct(pipelineSummary.closed, totalLeads) : 0,
      acceptance_rate: pct(totals.connections_accepted, totals.connections_sent),
      reply_rate: pct(totals.replies_received, totals.messages_sent),
      top_performer_id: topPerformerId,
      needs_attention_id: needsAttentionId,
      pipeline_summary: pipelineSummary,
      recommendations: recommendations.join("\n"),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/sales/weekly");
  return { success: true, reportId: report?.id };
}

export async function getWeeklyReports() {
  await requireSalesOwner();
  const supabase = createAdminClient();

  const { data: reports, error } = await supabase
    .from("weekly_reports")
    .select(`
      *,
      top_performer:employees!weekly_reports_top_performer_id_fkey(id, full_name),
      needs_attention:employees!weekly_reports_needs_attention_id_fkey(id, full_name)
    `)
    .order("week_start", { ascending: false })
    .limit(12);

  if (error) return { reports: [], error: error.message };
  return { reports: reports ?? [], error: null };
}

export async function getWeeklyReportById(reportId: string) {
  await requireSalesOwner();
  const supabase = createAdminClient();

  const { data: report, error } = await supabase
    .from("weekly_reports")
    .select(`
      *,
      top_performer:employees!weekly_reports_top_performer_id_fkey(id, full_name),
      needs_attention:employees!weekly_reports_needs_attention_id_fkey(id, full_name)
    `)
    .eq("id", reportId)
    .single();

  if (error) return { report: null, error: error.message };
  return { report, error: null };
}
