import { getCommandCenterData } from "@/actions/sales";
import { requireSalesOwner } from "@/lib/auth";
import { MetricGlowCard } from "@/components/sales/metric-glow-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { pct, progressColor, sumSnapshots } from "@/lib/sales/stats";
import { cn } from "@/lib/utils";

export default async function CommandCenterPage() {
  await requireSalesOwner();
  const data = await getCommandCenterData();
  const { teamToday, repStats, profiles, snapshots } = data;

  const connPct = pct(teamToday.connections_sent, repStats.reduce((s, r) => s + r.target.connections_daily, 0) || 1);
  const replyPct = pct(teamToday.replies_received, teamToday.messages_sent);
  const sheetTotals = sumSnapshots(snapshots);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricGlowCard
          title="Connections"
          value={teamToday.connections_sent}
          subtitle={`${connPct}% of daily team target`}
          icon={Link2}
          accent="primary"
        />
        <MetricGlowCard
          title="Accepted"
          value={teamToday.connections_accepted}
          subtitle={`${pct(teamToday.connections_accepted, teamToday.connections_sent)}% acceptance`}
          icon={Users}
          accent="emerald"
        />
        <MetricGlowCard
          title="Reply rate"
          value={`${replyPct}%`}
          subtitle={`${teamToday.replies_received} / ${teamToday.messages_sent} messages`}
          icon={MessageSquare}
          accent="blue"
        />
        <MetricGlowCard
          title="Meetings"
          value={teamToday.meetings_booked}
          subtitle={`${teamToday.follow_ups_done} follow-ups today`}
          icon={CalendarCheck}
          accent="violet"
        />
      </div>

      <MetricGlowCard
        title="Active leads (Google Sheets)"
        value={sheetTotals.active_leads}
        subtitle={`${profiles.length} profiles · synced today`}
        icon={FileSpreadsheet}
        className="max-w-md"
      />

      <Card className="border-border/60 bg-card/70 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Team scorecard</CardTitle>
          <CardDescription>Today&apos;s progress vs individual targets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {repStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales reps with BD role yet. Assign pm_role &quot;bd&quot; to employees.</p>
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

      <Card className="border-border/60 bg-card/70 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Pipeline by profile</CardTitle>
          <CardDescription>From Google Sheet snapshots</CardDescription>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No profiles configured. Add them under Sales → Profiles.
            </p>
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
                      <TableCell className="text-right">{snap?.won_mtd ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
