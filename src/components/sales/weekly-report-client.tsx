"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricGlowCard } from "@/components/sales/metric-glow-card";
import { Separator } from "@/components/ui/separator";
import {
  Link2,
  MessageSquare,
  CalendarCheck,
  Trophy,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  FileBarChart,
  Users,
  Download,
  Printer,
} from "lucide-react";

interface WeeklyData {
  totals: {
    connections_sent: number;
    connections_accepted: number;
    messages_sent: number;
    replies_received: number;
    follow_ups_done: number;
    meetings_booked: number;
    leads_added: number;
    proposals_sent: number;
  };
  activeLeads: number;
  wonMtd: number;
  replyRate: number;
  acceptanceRate: number;
  topPerformer: string;
  needsAttention: string;
  weekLabel: string;
}

export function WeeklyReportClient({ data }: { data: WeeklyData }) {
  const r = data;
  const conversionRate = r.totals.messages_sent > 0
    ? Math.round((r.totals.meetings_booked / r.totals.messages_sent) * 100)
    : 0;

  function handlePrint() {
    window.print();
  }

  function handleExport() {
    const rows = [
      ["Metric", "Value"],
      ["Week Starting", r.weekLabel],
      ["Total Connections", r.totals.connections_sent],
      ["Connections Accepted", r.totals.connections_accepted],
      ["Acceptance Rate", `${r.acceptanceRate}%`],
      ["Total Messages", r.totals.messages_sent],
      ["Replies Received", r.totals.replies_received],
      ["Reply Rate", `${r.replyRate}%`],
      ["Follow-ups Done", r.totals.follow_ups_done],
      ["Meetings Booked", r.totals.meetings_booked],
      ["Leads Generated", r.totals.leads_added],
      ["Proposals Sent", r.totals.proposals_sent],
      ["Active Leads", r.activeLeads],
      ["Won MTD", r.wonMtd],
      ["Conversion Rate", `${conversionRate}%`],
      ["Top Performer", r.topPerformer],
      ["Needs Attention", r.needsAttention],
    ];
    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weekly-report-${r.weekLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <Card className="overflow-hidden border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card shadow-xl">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Weekly CEO Report</CardTitle>
              <CardDescription>Week starting {r.weekLabel}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
          <MetricGlowCard title="Connections" value={r.totals.connections_sent} subtitle={`${r.acceptanceRate}% accepted`} icon={Link2} />
          <MetricGlowCard title="Meetings" value={r.totals.meetings_booked} accent="emerald" icon={Trophy} />
          <MetricGlowCard title="Reply rate" value={`${r.replyRate}%`} subtitle={`${r.totals.replies_received} replies`} accent="blue" icon={Lightbulb} />
          <MetricGlowCard title="Active leads" value={r.activeLeads} subtitle={`${r.wonMtd} won MTD`} accent="violet" icon={AlertCircle} />
        </CardContent>
      </Card>

      {/* Top Performer & Needs Attention */}
      <div className="grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-5 w-5 text-emerald-500" />
              Top performer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{r.topPerformer}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Needs attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{r.needsAttention}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-primary" />
            Detailed Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Connections sent", value: r.totals.connections_sent, icon: Link2 },
              { label: "Connections accepted", value: r.totals.connections_accepted, icon: Users },
              { label: "Messages sent", value: r.totals.messages_sent, icon: MessageSquare },
              { label: "Replies received", value: r.totals.replies_received, icon: MessageSquare },
              { label: "Follow-ups done", value: r.totals.follow_ups_done, icon: TrendingUp },
              { label: "Meetings booked", value: r.totals.meetings_booked, icon: CalendarCheck },
              { label: "Leads generated", value: r.totals.leads_added, icon: Users },
              { label: "Proposals sent", value: r.totals.proposals_sent, icon: FileBarChart },
              { label: "Conversion rate", value: `${conversionRate}%`, icon: TrendingUp },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                <m.icon className="h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                  <p className="text-lg font-bold tabular-nums">{m.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-muted-foreground">Acceptance rate</p>
              <p className="text-2xl font-bold">{r.acceptanceRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {r.acceptanceRate >= 30 ? "Above average — good targeting" : "Below 30% — review connection requests"}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-muted-foreground">Reply rate</p>
              <p className="text-2xl font-bold">{r.replyRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {r.replyRate >= 15 ? "Healthy response rate" : "Below 15% — improve message personalization"}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <p className="font-semibold">Recommendations</p>
            {r.totals.connections_sent < 100 && (
              <p className="text-muted-foreground">• Team connection volume is low. Consider increasing daily targets.</p>
            )}
            {r.replyRate < 10 && (
              <p className="text-muted-foreground">• Reply rate is below 10%. Review message templates and personalization.</p>
            )}
            {r.totals.meetings_booked === 0 && (
              <p className="text-muted-foreground">• No meetings booked this week. Focus on converting interested leads.</p>
            )}
            {r.activeLeads > 50 && (
              <p className="text-muted-foreground">• Large active pipeline ({r.activeLeads} leads). Ensure timely follow-ups.</p>
            )}
            {r.totals.follow_ups_done < r.totals.connections_accepted * 0.3 && (
              <p className="text-muted-foreground">• Follow-up rate is low. Prioritize engaging accepted connections.</p>
            )}
            {r.totals.connections_sent >= 100 && r.replyRate >= 15 && r.totals.meetings_booked > 0 && (
              <p className="text-green-600">• Strong week! Keep up the momentum across all metrics.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
