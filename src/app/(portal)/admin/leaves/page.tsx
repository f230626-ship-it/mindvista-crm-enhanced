import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { LeaveActions } from "@/components/admin/leave-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default async function AdminLeavesPage() {
  const employee = await requireRole("admin", "manager");
  const supabase = createAdminClient();

  const pendingForLead = await getPendingLeavesForLead();

  const { data: allLeaves } = isAdmin(employee.role)
    ? await supabase
        .from("leaves")
        .select("*, employee:employees!leaves_employee_id_fkey(id, full_name, email, designation, employee_code)")
        .order("created_at", { ascending: false })
    : { data: null };

  const pending = isAdmin(employee.role)
    ? (allLeaves?.filter((l) => l.status === "pending") ?? [])
    : pendingForLead;

  const processed = isAdmin(employee.role)
    ? (allLeaves?.filter((l) => l.status !== "pending") ?? [])
    : [];

  return (
    <div>
      <PageHeader
        title="Leave Approvals"
        description="Review and approve employee leave requests"
      />

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          {isAdmin(employee.role) && <TabsTrigger value="history">History</TabsTrigger>}
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {pending.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pending.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{leave.employee?.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {leave.employee?.employee_code ?? leave.employee?.designation}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{LEAVE_TYPE_LABELS[leave.leave_type]}</TableCell>
                        <TableCell>
                          {formatDate(leave.start_date)} – {formatDate(leave.end_date)}
                        </TableCell>
                        <TableCell>{leave.days_count}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{leave.reason}</TableCell>
                        <TableCell>
                          <LeaveActions leaveId={leave.id} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No pending leave requests</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin(employee.role) && (
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Processed Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processed.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell>{leave.employee?.full_name}</TableCell>
                        <TableCell>{LEAVE_TYPE_LABELS[leave.leave_type]}</TableCell>
                        <TableCell>
                          {formatDate(leave.start_date)} – {formatDate(leave.end_date)}
                        </TableCell>
                        <TableCell>{leave.days_count}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[leave.status]} variant="secondary">
                            {LEAVE_STATUS_LABELS[leave.status]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
