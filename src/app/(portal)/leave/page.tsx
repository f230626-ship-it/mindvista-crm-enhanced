import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth, isAdmin } from "@/lib/auth";
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
import { LeaveQuotaEditor } from "@/components/admin/leave-quota-editor";

export default async function LeavePage() {
  const employee = await requireAuth();
  const supabase = createAdminClient();

  const [{ data: leaves }, { data: balance }, pendingForLead, admin] = await Promise.all([
    supabase
      .from("leaves")
      .select("*")
      .eq("employee_id", employee.id)
      .order("created_at", { ascending: false }),
    supabase.from("leave_balances").select("*").eq("employee_id", employee.id).maybeSingle(),
    getPendingLeavesForLead(),
    isAdmin(employee.role),
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

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Leave Balance</h2>
          {admin && (
            <p className="text-xs text-muted-foreground">Editing quotas applies to all employees</p>
          )}
        </div>
        {admin && (
          <LeaveQuotaEditor
            annualQuota={balance?.annual_quota ?? 5}
            sickQuota={balance?.sick_quota ?? 5}
            casualQuota={balance?.casual_quota ?? 3}
          />
        )}
      </div>
      <div className="mb-6 grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
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
          <div className="overflow-x-auto">
          {leaves && leaves.length > 0 ? (
            <Table style={{ tableLayout: 'fixed' }}>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border/50">
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[16%]">Type</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[18%]">From</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[18%]">To</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[10%] text-right">Days</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[18%]">Status</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[20%]">Applied</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((leave) => (
                    <TableRow key={leave.id} className="border-b border-border/30">
                      <TableCell className="py-2.5 px-3 text-sm">{LEAVE_TYPE_LABELS[leave.leave_type]}</TableCell>
                      <TableCell className="py-2.5 px-3 text-sm whitespace-nowrap">{formatDate(leave.start_date)}</TableCell>
                      <TableCell className="py-2.5 px-3 text-sm whitespace-nowrap">{formatDate(leave.end_date)}</TableCell>
                      <TableCell className="py-2.5 px-3 text-right tabular-nums font-semibold">{leave.days_count}</TableCell>
                      <TableCell className="py-2.5 px-3">
                        <Badge className={STATUS_COLORS[leave.status]} variant="secondary">
                          {LEAVE_STATUS_LABELS[leave.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-sm text-muted-foreground">{formatDate(leave.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No leave requests yet</p>
          )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
