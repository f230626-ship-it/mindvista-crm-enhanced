import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ASSET_TYPE_LABELS, ASSET_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/date";
import { Package } from "lucide-react";

export default async function AssetsPage() {
  const employee = await requireAuth();
  const supabase = createAdminClient();

  const { data: assignments } = await supabase
    .from("asset_assignments")
    .select("*, asset:assets(*)")
    .eq("employee_id", employee.id)
    .order("assigned_date", { ascending: false });

  const active = assignments?.filter((a) => !a.return_date) ?? [];
  const history = assignments?.filter((a) => a.return_date) ?? [];

  return (
    <div>
      <PageHeader
        title="My Assets"
        description="View company equipment assigned to you"
      />

      {active.length > 0 ? (
        <div className="mb-8 grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
          {active.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Package className="h-5 w-5 text-primary" />
                  <Badge>{ASSET_STATUS_LABELS[assignment.asset?.status ?? "assigned"]}</Badge>
                </div>
                <CardTitle className="text-base">{assignment.asset?.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span>{ASSET_TYPE_LABELS[assignment.asset?.asset_type ?? "other"]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serial</span>
                  <span>{assignment.asset?.serial_number ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned</span>
                  <span>{formatDate(assignment.assigned_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Condition</span>
                  <span>{assignment.asset?.condition ?? "—"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title="No assets assigned"
          description="Company equipment assigned to you will appear here"
        />
      )}

      {history.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold">Assignment History</h3>
          <div className="grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
            {history.map((assignment) => (
              <Card key={assignment.id} className="opacity-75">
                <CardHeader>
                  <CardTitle className="text-base">{assignment.asset?.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {formatDate(assignment.assigned_date)} – {formatDate(assignment.return_date!)}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
