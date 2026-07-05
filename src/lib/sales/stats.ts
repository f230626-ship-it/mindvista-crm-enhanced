import type { SalesDailyLog, SalesSheetSnapshot } from "@/types/database";

export function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function sumLogs(logs: Pick<SalesDailyLog, 
  | "connections_sent" | "connections_accepted" | "messages_sent" | "replies_received"
  | "follow_ups_done" | "meetings_booked" | "leads_added" | "proposals_sent"
>[]) {
  return logs.reduce(
    (acc, l) => ({
      connections_sent: acc.connections_sent + l.connections_sent,
      connections_accepted: acc.connections_accepted + l.connections_accepted,
      messages_sent: acc.messages_sent + l.messages_sent,
      replies_received: acc.replies_received + l.replies_received,
      follow_ups_done: acc.follow_ups_done + l.follow_ups_done,
      meetings_booked: acc.meetings_booked + l.meetings_booked,
      leads_added: acc.leads_added + l.leads_added,
      proposals_sent: acc.proposals_sent + l.proposals_sent,
    }),
    {
      connections_sent: 0,
      connections_accepted: 0,
      messages_sent: 0,
      replies_received: 0,
      follow_ups_done: 0,
      meetings_booked: 0,
      leads_added: 0,
      proposals_sent: 0,
    }
  );
}

export function performanceScore(
  totals: ReturnType<typeof sumLogs>,
  targets: { connections_daily: number; messages_daily: number; meetings_weekly: number },
  days: number
) {
  const connTarget = targets.connections_daily * Math.max(days, 1);
  const msgTarget = targets.messages_daily * Math.max(days, 1);
  const meetTarget = targets.meetings_weekly;

  const connScore = Math.min(100, pct(totals.connections_sent, connTarget));
  const msgScore = Math.min(100, pct(totals.messages_sent, msgTarget));
  const replyScore = totals.messages_sent ? Math.min(100, pct(totals.replies_received, totals.messages_sent) * 2) : 0;
  const meetScore = Math.min(100, pct(totals.meetings_booked, meetTarget) * (7 / Math.max(days, 1)));

  return Math.round(connScore * 0.35 + msgScore * 0.25 + replyScore * 0.25 + meetScore * 0.15);
}

export function sumSnapshots(snapshots: SalesSheetSnapshot[]) {
  return snapshots.reduce(
    (acc, s) => ({
      active_leads: acc.active_leads + s.active_leads,
      follow_up: acc.follow_up + s.follow_up,
      intro_call: acc.intro_call + s.intro_call,
      trying_to_call: acc.trying_to_call + s.trying_to_call,
      won_mtd: acc.won_mtd + s.won_mtd,
    }),
    { active_leads: 0, follow_up: 0, intro_call: 0, trying_to_call: 0, won_mtd: 0 }
  );
}

export function weekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

export function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function progressColor(pctValue: number) {
  if (pctValue >= 85) return "from-emerald-500 to-emerald-400";
  if (pctValue >= 60) return "from-amber-500 to-amber-400";
  return "from-red-500 to-rose-400";
}

export function scoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "On track";
  if (score >= 50) return "Needs focus";
  return "At risk";
}
