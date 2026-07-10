import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils/date";
import { Star, Target, TrendingUp, Award, Calendar, CheckCircle } from "lucide-react";
import { PerformanceCharts } from "@/components/performance/performance-charts";

export default async function PerformancePage() {
  const employee = await requireAuth();
  const supabase = createAdminClient();

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

  // Calculate performance metrics
  const totalGoals = goals?.length ?? 0;
  const completedGoals = goals?.filter(g => g.completion_status === 100).length ?? 0;
  const averageCompletion = totalGoals > 0 ? 
    Math.round((goals?.reduce((sum, g) => sum + g.completion_status, 0) ?? 0) / totalGoals) : 0;
  const latestReview = reviews?.[0];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
            <Star className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Performance</h1>
            <p className="text-muted-foreground">Track your goals and review history</p>
          </div>
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Goals</p>
                <p className="text-3xl font-bold">{totalGoals}</p>
                <p className="text-xs text-muted-foreground mt-1">Active objectives</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white">
                <Target className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-gradient-to-br from-green-500/10 to-green-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold">{completedGoals}</p>
                <p className="text-xs text-muted-foreground mt-1">Goals achieved</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Progress</p>
                <p className="text-3xl font-bold">{averageCompletion}%</p>
                <p className="text-xs text-muted-foreground mt-1">Overall completion</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500 text-white">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-gradient-to-br from-amber-500/10 to-amber-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Latest Rating</p>
                <p className="text-3xl font-bold">
                  {latestReview?.rating ? `${latestReview.rating}/5` : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {latestReview ? latestReview.review_period : 'No reviews yet'}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-white">
                <Award className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <PerformanceCharts goals={goals ?? []} reviews={reviews ?? []} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Goals & KPIs */}
        <Card className="overflow-hidden pt-0">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 py-(--card-spacing)">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Goals & KPIs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {goals && goals.length > 0 ? (
              <div className="divide-y divide-border">
                {goals.map((goal) => (
                  <div key={goal.id} className="p-6 hover:bg-muted/30 transition-colors">
                    <div className="mb-3 flex items-start justify-between">
                      <h3 className="font-semibold">{goal.title}</h3>
                      <Badge 
                        variant={goal.completion_status === 100 ? "default" : "secondary"}
                        className="ml-2"
                      >
                        {goal.completion_status}%
                      </Badge>
                    </div>
                    {goal.description && (
                      <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                        {goal.description}
                      </p>
                    )}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{goal.completion_status}%</span>
                      </div>
                      <Progress value={goal.completion_status} className="h-3" />
                    </div>
                    {goal.target_date && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Target: {formatDate(goal.target_date)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Target className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No goals set</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your manager will assign performance goals
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Reviews */}
        <Card className="overflow-hidden pt-0">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 py-(--card-spacing)">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Performance Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {reviews && reviews.length > 0 ? (
              <div className="divide-y divide-border">
                {reviews.map((review) => (
                  <div key={review.id} className="p-6 hover:bg-muted/30 transition-colors">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold">{review.review_period}</h3>
                      {review.rating && (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <Badge variant="secondary">{review.rating}/5</Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {review.strengths && (
                        <div className="rounded-lg bg-green-500/10 p-3">
                          <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                            ✅ Strengths
                          </p>
                          <p className="text-sm leading-relaxed">{review.strengths}</p>
                        </div>
                      )}
                      
                      {review.improvement_areas && (
                        <div className="rounded-lg bg-amber-500/10 p-3">
                          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                            📈 Areas for Improvement
                          </p>
                          <p className="text-sm leading-relaxed">{review.improvement_areas}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <Award className="h-3 w-3" />
                      Reviewed on {formatDate(review.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Star className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No reviews yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Quarterly performance reviews will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
