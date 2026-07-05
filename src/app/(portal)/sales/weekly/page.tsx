import { getWeeklyReportData } from "@/actions/sales";
import { requireSalesOwner } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MetricGlowCard } from "@/components/sales/metric-glow-card";
import { Badge } from "@/components/ui/badge";
import { Link2, Trophy, AlertCircle, Lightbulb } from "lucide-react";

export default async function WeeklyReportPage() {
  await requireSalesOwner();
  const r = await getWeeklyReportData();

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Weekly CEO Report</CardTitle>
          <CardDescription>Week starting {r.weekLabel} · Auto-generated every Friday</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricGlowCard title="Connections" value={r.totals.connections_sent} icon={Link2} />
          <MetricGlowCard title="Meetings" value={r.totals.meetings_booked} accent="emerald" icon={Trophy} />
          <MetricGlowCard title="Reply rate" value={`${r.replyRate}%`} accent="blue" icon={Lightbulb} />
          <MetricGlowCard title="Active leads" value={r.activeLeads} subtitle={`${r.wonMtd} won MTD`} accent="violet" icon={AlertCircle} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Insights
            <Badge variant="outline">Rule-based</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Team acceptance rate: <strong>{r.acceptanceRate}%</strong></p>
          <p>• Total messages sent: <strong>{r.totals.messages_sent}</strong></p>
          <p>• Follow-ups completed: <strong>{r.totals.follow_ups_done}</strong></p>
          <p className="pt-2 text-muted-foreground">AI-generated recommendations coming in Phase 2.</p>
        </CardContent>
      </Card>
    </div>
  );
}
