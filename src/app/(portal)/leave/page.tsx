import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { LeaveForm } from "@/components/leave/leave-form";
import { PendingLeaveApprovals } from "@/components/leave/pending-approvals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/date";
import { getPendingLeavesForLead } from "@/actions/leaves";

export default async function LeavePage() {
  const employee = await requireAuth();
  const supabase = createAdminClient();

  const [{ data: leaves }, { data: balance }, pendingForLead] = await Promise.all([
    supabase
      .from("leaves")
      .select("*")
      .eq("employee_id", employee.id)
      .order("created_at", { ascending: false }),
    supabase.from("leave_balances").select("*").eq("employee_id", employee.id).maybeSingle(),
    getPendingLeavesForLead(),
  ]);

  return (
    <div>
      <PageHeader
        title="Leave Management"
        description="Apply for leave and track your requests"
        action={<LeaveForm />}
      />

      {pendingForLead.length > 0 && (
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle>Team Leave Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <PendingLeaveApprovals leaves={pendingForLead} />
          </CardContent>
        </Card>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Annual",
            remaining: (balance?.annual_quota ?? 0) - (balance?.annual_used ?? 0),
            total: balance?.annual_quota ?? 0,
          },
          {
            label: "Sick",
            remaining: (balance?.sick_quota ?? 0) - (balance?.sick_used ?? 0),
            total: balance?.sick_quota ?? 0,
          },
          {
            label: "Casual",
            remaining: (balance?.casual_quota ?? 0) - (balance?.casual_used ?? 0),
            total: balance?.casual_quota ?? 0,
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{item.label} Leave</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{item.remaining}</p>
              <p className="text-xs text-muted-foreground">of {item.total} days remaining</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave History</CardTitle>
        </CardHeader>
        <CardContent>
          {leaves && leaves.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>{LEAVE_TYPE_LABELS[leave.leave_type]}</TableCell>
                    <TableCell>{formatDate(leave.start_date)}</TableCell>
                    <TableCell>{formatDate(leave.end_date)}</TableCell>
                    <TableCell>{leave.days_count}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[leave.status]} variant="secondary">
                        {LEAVE_STATUS_LABELS[leave.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(leave.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No leave requests yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
