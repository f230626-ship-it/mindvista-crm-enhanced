import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils/date";
import { Star, Target } from "lucide-react";

export default async function PerformancePage() {
  const employee = await requireAuth();
  const supabase = await createClient();

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

  return (
    <div>
      <PageHeader
        title="Performance"
        description="Track your goals and review history"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goals & KPIs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goals && goals.length > 0 ? (
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.id} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <p className="font-medium">{goal.title}</p>
                      <span className="text-sm text-muted-foreground">
                        {goal.completion_status}%
                      </span>
                    </div>
                    {goal.description && (
                      <p className="mb-3 text-sm text-muted-foreground">{goal.description}</p>
                    )}
                    <Progress value={goal.completion_status} className="h-2" />
                    {goal.target_date && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Target: {formatDate(goal.target_date)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Target}
                title="No goals set"
                description="Your manager will assign performance goals"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Performance Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium">{review.review_period}</p>
                      {review.rating && (
                        <Badge variant="secondary">{review.rating}/5</Badge>
                      )}
                    </div>
                    {review.strengths && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-muted-foreground">Strengths</p>
                        <p className="text-sm">{review.strengths}</p>
                      </div>
                    )}
                    {review.improvement_areas && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Improvement Areas</p>
                        <p className="text-sm">{review.improvement_areas}</p>
                      </div>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      By Manager · {formatDate(review.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Star}
                title="No reviews yet"
                description="Quarterly performance reviews will appear here"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
