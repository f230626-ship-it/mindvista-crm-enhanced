import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils/date";
import { Star, Target, TrendingUp, Award, Calendar, CheckCircle, Activity, RefreshCw } from "lucide-react";
import { PerformanceCharts } from "@/components/performance/performance-charts";
import { recalculateAllGoals } from "@/lib/performance/goal-calculator";
import { RefreshButton } from "@/components/performance/refresh-button";

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconColor,
}: {
  label: string;
  value: string | number;
  subtitle: string;
  icon: typeof Target;
  iconColor: string;
}) {
  return (
    <Card className="overflow-hidden border-border/40 bg-card/80 backdrop-blur-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-1.5 text-3xl font-extrabold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${iconColor}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default async function PerformancePage() {
  const employee = await requireAuth();
  const supabase = createAdminClient();

  await recalculateAllGoals(employee.id);

  const [{ data: goals }, { data: reviews }] = await Promise.all([
    supabase
      .from("performance_goals")
      .select("*")
      .eq("employee_id", employee.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("performance_reviews")
      .select("*")
      .eq("employee_id", employee.id)
      .order("created_at", { ascending: false }),
  ]);

  const totalGoals = goals?.length ?? 0;
  const completedGoals = goals?.filter((g) => g.completion_status === 100).length ?? 0;
  const averageCompletion =
    totalGoals > 0
      ? Math.round(
          (goals?.reduce((sum, g) => sum + g.completion_status, 0) ?? 0) / totalGoals
        )
      : 0;
  const latestReview = reviews?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/20">
          <Star className="h-5 w-5 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Performance</h1>
          <p className="text-sm text-muted-foreground">Track your goals and review history</p>
        </div>
      </div>

      {/* Stat Cards — strict 4-col grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Goals"
          value={totalGoals}
          subtitle="Active objectives"
          icon={Target}
          iconColor="bg-blue-500/10 ring-blue-500/20 text-blue-500"
        />
        <StatCard
          label="Completed"
          value={completedGoals}
          subtitle="Goals achieved"
          icon={CheckCircle}
          iconColor="bg-emerald-500/10 ring-emerald-500/20 text-emerald-500"
        />
        <StatCard
          label="Avg Progress"
          value={`${averageCompletion}%`}
          subtitle="Overall completion"
          icon={TrendingUp}
          iconColor="bg-violet-500/10 ring-violet-500/20 text-violet-500"
        />
        <StatCard
          label="Latest Rating"
          value={latestReview?.rating ? `${latestReview.rating}/5` : "—"}
          subtitle={latestReview ? latestReview.review_period : "No reviews yet"}
          icon={Award}
          iconColor="bg-amber-500/10 ring-amber-500/20 text-amber-500"
        />
      </div>

      {/* Charts — strict 2-col grid */}
      <PerformanceCharts goals={goals ?? []} reviews={reviews ?? []} />

      {/* Bottom section — strict 2-col grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Goals & KPIs */}
        <Card className="overflow-hidden border-border/40 bg-card/80 pt-0 backdrop-blur-sm">
          <CardHeader className="border-b border-border/40 bg-muted/20 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-primary" />
                Goals & KPIs
              </CardTitle>
              <RefreshButton />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {goals && goals.length > 0 ? (
              <div className="divide-y divide-border/40">
                {goals.map((goal) => (
                  <div key={goal.id} className="px-5 py-4">
                    <div className="mb-2.5 flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold">{goal.title}</h3>
                        {goal.description && (
                          <p className="mt-0.5 text-sm text-muted-foreground">{goal.description}</p>
                        )}
                      </div>
                      <Badge
                        variant={goal.completion_status === 100 ? "default" : "secondary"}
                        className="ml-3 shrink-0"
                      >
                        {goal.completion_status}%
                      </Badge>
                    </div>
                    <Progress value={goal.completion_status} className="h-1.5" />
                    {goal.target_date && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Target: {formatDate(goal.target_date)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
                  <Target className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-3 text-sm font-semibold">No goals set</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Admins can assign goals from Performance Management
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Reviews */}
        <Card className="overflow-hidden border-border/40 bg-card/80 pt-0 backdrop-blur-sm">
          <CardHeader className="border-b border-border/40 bg-muted/20 py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-primary" />
              Performance Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {reviews && reviews.length > 0 ? (
              <div className="divide-y divide-border/40">
                {reviews.map((review) => (
                  <div key={review.id} className="px-5 py-4">
                    <div className="mb-2.5 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{review.review_period}</h3>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(review.created_at)}
                        </p>
                      </div>
                      {review.rating && (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {review.rating}/5
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {review.strengths && (
                        <div className="rounded-lg bg-emerald-500/5 p-2.5 text-sm">
                          <span className="font-medium text-emerald-500">Strengths: </span>
                          <span className="text-muted-foreground">{review.strengths}</span>
                        </div>
                      )}
                      {review.improvement_areas && (
                        <div className="rounded-lg bg-amber-500/5 p-2.5 text-sm">
                          <span className="font-medium text-amber-500">Improve: </span>
                          <span className="text-muted-foreground">{review.improvement_areas}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
                  <Star className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-3 text-sm font-semibold">No reviews yet</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Quarterly reviews will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
