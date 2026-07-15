import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { GoalForm, ReviewForm } from "@/components/admin/performance-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils/date";
import { recalculateAllGoals } from "@/lib/performance/goal-calculator";
import { RefreshCw, Trash2, Activity } from "lucide-react";
import { DeleteGoalButton } from "@/components/performance/delete-goal-button";
import { AdminRefreshButton } from "@/components/performance/admin-refresh-button";

export default async function AdminPerformancePage() {
  await requireRole("admin");
  const supabase = createAdminClient();

  // Auto-calculate all goals
  await recalculateAllGoals();

  const [{ data: goals }, { data: reviews }, { data: employeesList }] = await Promise.all([
    supabase
      .from("performance_goals")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("performance_reviews")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("employees")
      .select("id, full_name")
      .eq("status", "active")
      .order("full_name"),
  ]);

  const employees = employeesList ?? [];
  const employeeMap = Object.fromEntries(employees.map((e) => [e.id, e.full_name]));

  return (
    <div>
      <PageHeader
        title="Performance Management"
        description="Set goals and submit performance reviews — goal progress updates automatically from sales, projects, and attendance data"
        action={
          <div className="flex gap-2">
            <AdminRefreshButton />
            <GoalForm employees={employees} />
            <ReviewForm employees={employees} />
          </div>
        }
      />

      <Tabs defaultValue="goals">
        <TabsList>
          <TabsTrigger value="goals">Goals ({goals?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Employee Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {goals && goals.length > 0 ? (
                <div className="space-y-4">
                  {goals.map((goal) => (
                    <div key={goal.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{goal.title}</p>
                            <Badge variant="outline" className="text-[10px]">
                              Auto-tracked
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {employeeMap[goal.employee_id] ?? "Employee"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">{goal.completion_status}%</span>
                          <DeleteGoalButton goalId={goal.id} />
                        </div>
                      </div>
                      {goal.description && (
                        <p className="mb-3 text-sm text-muted-foreground">{goal.description}</p>
                      )}
                      <Progress value={goal.completion_status} className="h-2" />
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {goal.completion_status >= 100
                            ? "Completed"
                            : goal.completion_status > 0
                              ? "In progress"
                              : "Not started"}
                        </span>
                        {goal.target_date && (
                          <span>Target: {formatDate(goal.target_date)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No goals set yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Performance Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{employeeMap[review.employee_id] ?? "Employee"}</p>
                          <p className="text-sm text-muted-foreground">{review.review_period}</p>
                        </div>
                        {review.rating && (
                          <Badge variant="secondary">{review.rating}/5</Badge>
                        )}
                      </div>
                      {review.strengths && (
                        <p className="text-sm">
                          <span className="font-medium">Strengths: </span>
                          {review.strengths}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(review.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No reviews submitted yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
