import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/date";
import {
  Star,
  Target,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { PerformanceCharts } from "@/components/performance/performance-charts";
import { RefreshButton } from "@/components/performance/refresh-button";

export default async function PerformancePage() {
  const employee = await requireAuth();
  const supabase = createAdminClient();

  const [{ data: goals }, { data: reviews }, { data: salesLogs }] = await Promise.all([
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
    supabase
      .from("sales_daily_log")
      .select("*")
      .eq("employee_id", employee.id)
      .order("log_date", { ascending: true })
      .limit(30),
  ]);

  const totalGoals = goals?.length ?? 0;
  const completedGoals = goals?.filter((g) => g.completion_status === 100).length ?? 0;
  const inProgressGoals = goals?.filter((g) => g.completion_status > 0 && g.completion_status < 100).length ?? 0;
  const notStartedGoals = goals?.filter((g) => g.completion_status === 0).length ?? 0;
  const averageCompletion =
    totalGoals > 0
      ? Math.round(
          (goals?.reduce((sum, g) => sum + g.completion_status, 0) ?? 0) / totalGoals
        )
      : 0;
  const latestReview = reviews?.[0];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">My Performance</h1>
        <p className="text-muted-foreground">Track your goals, reviews, and progress over time</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoals}</div>
            <p className="text-xs text-muted-foreground">Active objectives</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Goals</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedGoals}</div>
            <p className="text-xs text-muted-foreground">{totalGoals > 0 ? `${Math.round((completedGoals/totalGoals)*100)}% completion rate` : "No goals yet"}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageCompletion}%</div>
            <Progress value={averageCompletion} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Latest Rating</CardTitle>
            <Award className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestReview?.rating ? `${latestReview.rating}/5` : "—"}</div>
            <p className="text-xs text-muted-foreground">{latestReview ? latestReview.review_period : "No reviews yet"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts Section */}
      <PerformanceCharts 
        goals={goals ?? []} 
        reviews={reviews ?? []} 
        salesLogs={salesLogs ?? []}
      />

      {/* Bottom Section: Goals & Reviews */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Goals Section */}
        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">Goals & KPIs</CardTitle>
              <CardDescription>Track your ongoing objectives</CardDescription>
            </div>
            <RefreshButton />
          </CardHeader>
          <CardContent className="space-y-4">
            {goals && goals.length > 0 ? (
              goals.map((goal) => (
                <div key={goal.id} className="space-y-2 border border-border/40 rounded-lg p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm truncate">{goal.title}</h4>
                      {goal.description && (
                        <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
                      )}
                    </div>
                    <Badge
                      variant={goal.completion_status === 100 ? "default" : "secondary"}
                      className="shrink-0"
                    >
                      {goal.completion_status}%
                    </Badge>
                  </div>
                  <Progress value={goal.completion_status} className="h-2" />
                  {goal.target_date && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                      <Calendar className="h-3 w-3" />
                      Target date: {formatDate(goal.target_date)}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
                  <Target className="h-6 w-6 text-muted-foreground" />
                </div>
                <h4 className="mt-3 text-sm font-semibold">No goals set</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Admins can assign goals from Performance Management
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Reviews Section */}
        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader>
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">Performance Reviews</CardTitle>
              <CardDescription>Your review history and feedback</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews && reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="space-y-3 border border-border/40 rounded-lg p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-medium text-sm">{review.review_period}</h4>
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

                  <div className="space-y-2 pt-2">
                    {review.strengths && (
                      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3">
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                          Strengths
                        </p>
                        <p className="text-sm text-muted-foreground">{review.strengths}</p>
                      </div>
                    )}
                    {review.improvement_areas && (
                      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                          Areas for Improvement
                        </p>
                        <p className="text-sm text-muted-foreground">{review.improvement_areas}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
                  <Star className="h-6 w-6 text-muted-foreground" />
                </div>
                <h4 className="mt-3 text-sm font-semibold">No reviews yet</h4>
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
