"use client";

import { useState, useEffect } from "react";
import { MetricGlowCard } from "@/components/sales/metric-glow-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Link2,
  MessageSquare,
  CalendarCheck,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trophy,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Target,
  Zap,
} from "lucide-react";
import { pct, progressColor, sumSnapshots } from "@/lib/sales/stats";
import { cn } from "@/lib/utils";
import { SnapshotSyncDialog } from "@/components/sales/snapshot-sync-dialog";
import { getLeaderboard, getSalesAlerts } from "@/actions/sales-analytics";
import type { SalesProfile, SalesSheetSnapshot } from "@/types/database";

interface CommandData {
  teamToday: {
    connections_sent: number;
    connections_accepted: number;
    messages_sent: number;
    replies_received: number;
    follow_ups_done: number;
    meetings_booked: number;
    leads_added: number;
    proposals_sent: number;
  };
  repStats: {
    id: string;
    full_name: string;
    email: string;
    target: { connections_daily: number; messages_daily: number; follow_ups_daily: number; meetings_weekly: number };
    weekTotals: { connections_sent: number; connections_accepted: number; messages_sent: number; replies_received: number; meetings_booked: number; follow_ups_done: number; leads_added: number };
    todayLogged: boolean;
    todayTotals: { connections_sent: number } | null;
    score: number;
    connectionsPct: number;
  }[];
  profiles: (SalesProfile & { snapshot?: SalesSheetSnapshot | null })[];
  snapshots: SalesSheetSnapshot[];
  targets: { employee_id: string }[];
}

interface LeaderboardData {
  topPerformer: { name: string; score: number; totals: { connections_sent: number; meetings_booked: number } } | null;
  mostMeetings: { name: string; totals: { meetings_booked: number } } | null;
  highestReplyRate: { name: string; replyRate: number } | null;
  overall: { id: string; name: string; score: number; daysLogged: number }[];
}

interface AlertData {
  id: string;
  type: "warning" | "danger" | "info";
  title: string;
  message: string;
  module: string;
}

export function CommandCenterClient({ data }: { data: CommandData }) {
  const [syncOpen, setSyncOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const { teamToday, repStats, profiles, snapshots } = data;

  const connPct = pct(teamToday.connections_sent, repStats.reduce((s, r) => s + r.target.connections_daily, 0) || 1);
  const replyPct = pct(teamToday.replies_received, teamToday.messages_sent);
  const sheetTotals = sumSnapshots(snapshots);

  // Fetch leaderboard and alerts on mount
  useEffect(() => {
    getLeaderboard().then(setLeaderboard).catch(() => {});
    getSalesAlerts().then((r) => setAlerts(r.alerts)).catch(() => {});
  }, []);

  // Pipeline from daily logs
  const totalConnections = repStats.reduce((s, r) => s + r.weekTotals.connections_sent, 0);
  const totalAccepted = repStats.reduce((s, r) => s + r.weekTotals.connections_accepted, 0);
  const totalMessages = repStats.reduce((s, r) => s + r.weekTotals.messages_sent, 0);
  const totalReplies = repStats.reduce((s, r) => s + r.weekTotals.replies_received, 0);
  const totalMeetings = repStats.reduce((s, r) => s + r.weekTotals.meetings_booked, 0);
  const totalLeads = repStats.reduce((s, r) => s + r.weekTotals.leads_added, 0);

  return (
    <div className="space-y-8">
      {/* Top KPI Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        <MetricGlowCard
          title="Connections"
          value={teamToday.connections_sent}
          subtitle={`${connPct}% of team target`}
          icon={Link2}
          accent="primary"
        />
        <MetricGlowCard
          title="Accepted"
          value={teamToday.connections_accepted}
          subtitle={`${pct(teamToday.connections_accepted, teamToday.connections_sent)}% rate`}
          icon={Users}
          accent="emerald"
        />
        <MetricGlowCard
          title="Reply rate"
          value={`${replyPct}%`}
          subtitle={`${teamToday.replies_received}/${teamToday.messages_sent}`}
          icon={MessageSquare}
          accent="blue"
        />
        <MetricGlowCard
          title="Meetings"
          value={teamToday.meetings_booked}
          subtitle={`${teamToday.follow_ups_done} follow-ups`}
          icon={CalendarCheck}
          accent="violet"
        />
        <MetricGlowCard
          title="Active leads"
          value={sheetTotals.active_leads}
          subtitle={`${profiles.length} profiles`}
          icon={FileSpreadsheet}
        />
        <MetricGlowCard
          title="Team score"
          value={repStats.length > 0 ? Math.round(repStats.reduce((s, r) => s + r.score, 0) / repStats.length) : 0}
          subtitle="Avg performance"
          icon={Zap}
          accent="emerald"
        />
      </div>

      {/* Pipeline Funnel */}
      <Card className="border-border/60 bg-card/70 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Weekly Pipeline
          </CardTitle>
          <CardDescription>Funnel from connections to meetings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: "Connections Sent", value: totalConnections, color: "bg-primary" },
              { label: "Accepted", value: totalAccepted, color: "bg-emerald-500", parent: totalConnections },
              { label: "Messages Sent", value: totalMessages, color: "bg-blue-500", parent: totalAccepted },
              { label: "Replies Received", value: totalReplies, color: "bg-amber-500", parent: totalMessages },
              { label: "Meetings Booked", value: totalMeetings, color: "bg-violet-500", parent: totalReplies },
            ].map((stage, i) => {
              const widthPct = totalConnections > 0 ? (stage.value / totalConnections) * 100 : 0;
              const convPct = stage.parent ? pct(stage.value, stage.parent) : 100;
              return (
                <div key={stage.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {stage.value} {stage.parent ? <span className="text-xs">({convPct}% conv.)</span> : null}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted/50">
                    <div
                      className={cn("h-full rounded-full transition-all", stage.color)}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Leaderboard */}
        <Card className="border-border/60 bg-card/70 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Leaderboard
            </CardTitle>
            <CardDescription>Top performers this week</CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboard?.overall && leaderboard.overall.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.overall.slice(0, 5).map((rep, i) => (
                  <div key={rep.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      i === 0 ? "bg-amber-500/15 text-amber-600" :
                      i === 1 ? "bg-slate-400/15 text-slate-500" :
                      i === 2 ? "bg-orange-500/15 text-orange-600" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{rep.name}</p>
                      <p className="text-xs text-muted-foreground">{rep.daysLogged} days logged</p>
                    </div>
                    <Badge>{rep.score}/100</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No data yet this week.</p>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="border-border/60 bg-card/70 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alerts
            </CardTitle>
            <CardDescription>Issues requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500/60" />
                <p className="text-sm text-muted-foreground">All clear — no alerts.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3",
                      alert.type === "danger" ? "border-red-500/20 bg-red-500/5" :
                      alert.type === "warning" ? "border-amber-500/20 bg-amber-500/5" :
                      "border-blue-500/20 bg-blue-500/5"
                    )}
                  >
                    <AlertTriangle className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      alert.type === "danger" ? "text-red-500" :
                      alert.type === "warning" ? "text-amber-500" :
                      "text-blue-500"
                    )} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{alert.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Google Sheets Pipeline Table */}
      <Card className="border-border/60 bg-card/70 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Pipeline by profile
              </CardTitle>
              <CardDescription>Google Sheet snapshots</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSyncOpen(true)} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Sync snapshot
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          {profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No profiles configured.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile</TableHead>
                  <TableHead>Rep</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                  <TableHead className="text-right">Follow-up</TableHead>
                  <TableHead className="text-right">Intro</TableHead>
                  <TableHead className="text-right">Won MTD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => {
                  const snap = snapshots.find((s) => s.profile_id === p.id);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {(p.employee as { full_name: string })?.full_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {snap?.active_leads ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">{snap?.follow_up ?? "—"}</TableCell>
                      <TableCell className="text-right">{snap?.intro_call ?? "—"}</TableCell>
                      <TableCell className="text-right">{snap?.won_mtd ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          </div>
        </CardContent>
      </Card>

      {/* Team Scorecard */}
      <Card className="border-border/60 bg-card/70 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Team scorecard</CardTitle>
          <CardDescription>Today&apos;s progress vs individual targets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {repStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales reps with BD role yet.</p>
          ) : (
            repStats.map((rep) => (
              <div key={rep.id} className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{rep.full_name}</span>
                    {rep.todayLogged ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{rep.score}/100</Badge>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {rep.todayTotals?.connections_sent ?? 0}/{rep.target.connections_daily} conn.
                    </span>
                  </div>
                </div>
                <Progress value={rep.connectionsPct}>
                  <ProgressTrack className="h-2.5 rounded-full">
                    <ProgressIndicator
                      className={cn("h-2.5 rounded-full bg-gradient-to-r", progressColor(rep.connectionsPct))}
                    />
                  </ProgressTrack>
                </Progress>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <SnapshotSyncDialog profiles={profiles} open={syncOpen} onOpenChange={setSyncOpen} />
    </div>
  );
}
