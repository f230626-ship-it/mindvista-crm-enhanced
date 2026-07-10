import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { GoalForm, ReviewForm } from "@/components/admin/performance-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils/date";

export default async function AdminPerformancePage() {
  await requireRole("admin", "manager");
  const supabase = createAdminClient();

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
        description="Set goals and submit performance reviews"
        action={
          <div className="flex gap-2">
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
              <CardTitle>Employee Goals</CardTitle>
            </CardHeader>
            <CardContent>
              {goals && goals.length > 0 ? (
                <div className="space-y-4">
                  {goals.map((goal) => (
                    <div key={goal.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{goal.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {employeeMap[goal.employee_id] ?? "Employee"}
                          </p>
                        </div>
                        <span className="text-sm font-medium">{goal.completion_status}%</span>
                      </div>
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
