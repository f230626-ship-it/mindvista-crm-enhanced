"use client";

import { useState } from "react";
import { upsertSalesTarget } from "@/actions/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Target, Trash2 } from "lucide-react";
import { EmployeeTilePicker } from "@/components/sales/employee-tile-picker";
import { DeleteTargetButton } from "@/components/sales/delete-target-button";
import type { SalesTarget } from "@/types/database";

export function TargetsPageClient({
  employees,
  targets,
}: {
  employees: { id: string; full_name: string; email: string; designation: string }[];
  targets: SalesTarget[];
}) {
  const [selectedId, setSelectedId] = useState(employees[0]?.id ?? "");
  const [loading, setLoading] = useState(false);

  const current = targets.find((t) => t.employee_id === selectedId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedId) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("employee_id", selectedId);
    const result = await upsertSalesTarget(formData);
    setLoading(false);
    if (result.error) toast.error(result.error);
    else toast.success("Targets updated");
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Daily & weekly targets
          </CardTitle>
          <CardDescription>Set goals per sales rep — used for scorecards and progress bars</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-3">
            <Label>Select rep</Label>
            <EmployeeTilePicker employees={employees} value={selectedId} onChange={setSelectedId} />
          </div>

          {selectedId && (
            <form key={selectedId} onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
                {(
                  [
                    { name: "connections_daily" as const, label: "Connections / day", default: 50 },
                    { name: "messages_daily" as const, label: "Messages / day", default: 20 },
                    { name: "follow_ups_daily" as const, label: "Follow-ups / day", default: 10 },
                    { name: "meetings_weekly" as const, label: "Meetings / week", default: 5 },
                  ] as const
                ).map((field) => (
                  <div key={field.name} className="space-y-2 rounded-xl border border-border/60 p-4">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min="0"
                      defaultValue={current?.[field.name] ?? field.default}
                      className="text-lg font-semibold"
                    />
                  </div>
                ))}
              </div>

              {/* Monthly Goal */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly_goal" className="text-base font-semibold">Monthly Connection Goal</Label>
                  <p className="text-xs text-muted-foreground">Total connections target for the month (used for progress tracking)</p>
                  <Input
                    id="monthly_goal"
                    name="monthly_goal"
                    type="number"
                    min="0"
                    defaultValue={(current as any)?.monthly_goal ?? 1000}
                    className="text-lg font-semibold max-w-xs"
                    placeholder="1000"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" size="lg" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Saving..." : "Save targets"}
                </Button>
                {current && (
                  <DeleteTargetButton
                    targetId={current.id}
                    repName={employees.find((e) => e.id === selectedId)?.full_name ?? "this rep"}
                  />
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
