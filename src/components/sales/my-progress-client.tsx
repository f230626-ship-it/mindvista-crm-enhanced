"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MetricGlowCard } from "@/components/sales/metric-glow-card";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import { Link2, MessageSquare, CalendarCheck, Trophy } from "lucide-react";
import { pct, progressColor, scoreLabel } from "@/lib/sales/stats";
import { cn } from "@/lib/utils";

interface ProgressData {
  weekTotals: {
    connections_sent: number;
    messages_sent: number;
    replies_received: number;
    meetings_booked: number;
    follow_ups_done: number;
  };
  target: {
    connections_daily: number;
    messages_daily: number;
    meetings_weekly: number;
  };
  score: number;
  trend: { date: string; connections: number; messages: number; meetings: number }[];
  snapshots: { active_leads: number; profile?: { name: string } }[];
}

export function MyProgressClient({ data }: { data: ProgressData }) {
  const connTarget = data.target.connections_daily * 5;
  const connPct = pct(data.weekTotals.connections_sent, connTarget);
  const replyPct = pct(data.weekTotals.replies_received, data.weekTotals.messages_sent);
  const activeLeads = data.snapshots.reduce((s, x) => s + x.active_leads, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 to-transparent px-6 py-4">
          <Trophy className="h-8 w-8 text-primary" />
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Performance score</p>
            <p className="text-3xl font-bold">{data.score}<span className="text-lg text-muted-foreground">/100</span></p>
            <Badge className="mt-1">{scoreLabel(data.score)}</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        <MetricGlowCard title="Connections" value={data.weekTotals.connections_sent} subtitle="This week" icon={Link2} />
        <MetricGlowCard title="Reply rate" value={`${replyPct}%`} subtitle={`${data.weekTotals.replies_received} replies`} icon={MessageSquare} accent="blue" />
        <MetricGlowCard title="Meetings" value={data.weekTotals.meetings_booked} subtitle={`Target: ${data.target.meetings_weekly}/wk`} icon={CalendarCheck} accent="violet" />
        <MetricGlowCard title="My active leads" value={activeLeads} subtitle="From your profiles" icon={Link2} accent="emerald" />
      </div>

      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle>Weekly target progress</CardTitle>
          <CardDescription>Connections vs {connTarget} weekly goal</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={connPct}>
            <ProgressTrack className="h-3 rounded-full">
              <ProgressIndicator className={cn("h-3 rounded-full bg-gradient-to-r", progressColor(connPct))} />
            </ProgressTrack>
          </Progress>
          <p className="mt-2 text-sm text-muted-foreground">{connPct}% complete</p>
        </CardContent>
      </Card>

      {data.trend.length > 0 && (
        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle>Activity trend</CardTitle>
            <CardDescription>Daily outreach this week</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id="connGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e5a158" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#e5a158" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                <Area type="monotone" dataKey="connections" stroke="#e5a158" fill="url(#connGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="messages" stroke="#64748b" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
