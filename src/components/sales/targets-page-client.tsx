"use client";

import { useState } from "react";
import { upsertSalesTarget } from "@/actions/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Target } from "lucide-react";
import { EmployeeTilePicker } from "@/components/sales/employee-tile-picker";
import type { SalesTarget } from "@/types/database";

export function TargetsPageClient({
  employees,
  targets,
}: {
  employees: { id: string; full_name: string; email: string; pm_role: string }[];
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
    <div className="mx-auto max-w-3xl space-y-6">
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
              <div className="grid gap-4 sm:grid-cols-2">
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
              <Button type="submit" size="lg" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Saving..." : "Save targets"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
