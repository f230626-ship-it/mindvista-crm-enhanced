"use client";

import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MetricGlowCard } from "@/components/sales/metric-glow-card";
import {
  Link2,
  MessageSquare,
  CalendarCheck,
  Users,
  Target,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { pct } from "@/lib/sales/stats";

const PIPELINE_COLORS = ["#64748b", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#22c55e", "#ef4444"];

interface AnalyticsData {
  period: { startDate: string; endDate: string; days: number };
  totals: {
    connections: number;
    accepted: number;
    messages: number;
    replies: number;
    followups: number;
    meetings_booked: number;
    leads: number;
  };
  dailyGrowth: {
    date: string;
    connections: number;
    accepted: number;
    messages: number;
    replies: number;
    followups: number;
    meetings_booked: number;
    leads: number;
  }[];
  pipeline: {
    cold: number;
    contacted: number;
    replied: number;
    interested: number;
    meeting_booked: number;
    closed: number;
    lost: number;
  };
  meetingStats: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  employeePerformance: {
    employeeId: string;
    name: string;
    connections_sent: number;
    messages_sent: number;
    meetings_booked: number;
    acceptanceRate: number;
    replyRate: number;
  }[];
  totalLeads: number;
}

const PIPELINE_LABELS: Record<string, string> = {
  cold: "Cold",
  contacted: "Contacted",
  replied: "Replied",
  interested: "Interested",
  meeting_booked: "Meeting Booked",
  closed: "Closed",
  lost: "Lost",
};

export function SalesAnalyticsClient({ data }: { data: AnalyticsData }) {
  const { period, totals, dailyGrowth, pipeline, meetingStats, employeePerformance, totalLeads } = data;

  const pipelineData = Object.entries(pipeline).map(([key, value]) => ({
    name: PIPELINE_LABELS[key] ?? key,
    value,
    color: PIPELINE_COLORS[Object.keys(pipeline).indexOf(key)],
  }));

  const totalPipeline = Object.values(pipeline).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold">Sales Analytics</h2>
        <p className="text-sm text-muted-foreground">
          {period.startDate} to {period.endDate} ({period.days} days)
        </p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <MetricGlowCard
          title="Connections"
          value={totals.connections}
          subtitle={`${pct(totals.accepted, totals.connections)}% accepted`}
          icon={Link2}
          accent="primary"
        />
        <MetricGlowCard
          title="Messages"
          value={totals.messages}
          subtitle={`${pct(totals.replies, totals.messages)}% reply rate`}
          icon={MessageSquare}
          accent="blue"
        />
        <MetricGlowCard
          title="Meetings"
          value={totals.meetings_booked}
          subtitle={`${meetingStats.completed} completed`}
          icon={CalendarCheck}
          accent="violet"
        />
        <MetricGlowCard
          title="Leads"
          value={totals.leads}
          subtitle={`${totalPipeline} in pipeline`}
          icon={Users}
          accent="emerald"
        />
        <MetricGlowCard
          title="Follow-ups"
          value={totals.followups}
          subtitle="Completed this period"
          icon={Target}
        />
        <MetricGlowCard
          title="Conversion"
          value={`${totalLeads > 0 ? pct(pipeline.closed, totalLeads) : 0}%`}
          subtitle={`${pipeline.closed} closed of ${totalLeads}`}
          icon={TrendingUp}
          accent="emerald"
        />
      </div>

      {/* Daily Growth Chart */}
      {dailyGrowth.length > 0 && (
        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle>Daily Growth</CardTitle>
            <CardDescription>Connections and messages over time</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyGrowth}>
                <defs>
                  <linearGradient id="connGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e5a158" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#e5a158" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="msgGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                <Legend />
                <Area type="monotone" dataKey="connections" name="Connections" stroke="#e5a158" fill="url(#connGradAnalytics)" strokeWidth={2} />
                <Area type="monotone" dataKey="messages" name="Messages" stroke="#3b82f6" fill="url(#msgGradAnalytics)" strokeWidth={2} />
                <Area type="monotone" dataKey="meetings_booked" name="Meetings" stroke="#8b5cf6" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pipeline Funnel */}
        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle>Sales Pipeline</CardTitle>
            <CardDescription>Lead distribution by status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pipelineData.map((stage) => {
              const barPct = totalPipeline > 0 ? (stage.value / totalPipeline) * 100 : 0;
              return (
                <div key={stage.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {stage.value} <span className="text-xs">({Math.round(barPct)}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted/50">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${barPct}%`, backgroundColor: stage.color }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Team Performance Table */}
        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Per-rep metrics for the period</CardDescription>
          </CardHeader>
          <CardContent>
            {employeePerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No data for this period.</p>
            ) : (
              <div className="space-y-3">
                {employeePerformance
                  .sort((a, b) => b.connections_sent - a.connections_sent)
                  .map((emp) => (
                    <div key={emp.employeeId} className="flex items-center justify-between rounded-xl border border-border/60 p-3">
                      <div>
                        <p className="font-semibold text-sm">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {emp.connections_sent} conn. · {emp.messages_sent} msgs · {emp.meetings_booked} mtgs
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="tabular-nums">{emp.acceptanceRate}% acc</span>
                        <span className="tabular-nums">{emp.replyRate}% rep</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Meeting Stats */}
      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle>Meeting Overview</CardTitle>
          <CardDescription>Meeting status breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
            {[
              { label: "Total", value: meetingStats.total, color: "text-primary" },
              { label: "Pending", value: meetingStats.pending, color: "text-amber-500" },
              { label: "Completed", value: meetingStats.completed, color: "text-green-500" },
              { label: "Cancelled", value: meetingStats.cancelled, color: "text-red-500" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border/60 p-4 text-center">
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
