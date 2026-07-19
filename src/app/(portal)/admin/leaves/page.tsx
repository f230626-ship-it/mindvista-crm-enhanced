import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { LeaveActions } from "@/components/admin/leave-actions";
import { LeaveQuotaAdjuster } from "@/components/admin/leave-quota-adjuster";
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
  const employee = await requireRole("admin");
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

  // Fetch all leave balances with employee info (admin only)
  let leaveBalances: any[] = [];
  if (isAdmin(employee.role)) {
    const { data } = await supabase
      .from("leave_balances")
      .select(`
        *,
        employee:employees!leave_balances_employee_id_fkey(id, full_name, email, employee_code, designation, status)
      `)
      .order("created_at", { ascending: false });
    leaveBalances = (data ?? []).filter((b: any) => b.employee?.status === "active");
  }

  return (
    <div>
      <PageHeader
        title="Leave Approvals"
        description="Review and approve employee leave requests"
      />

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          {isAdmin(employee.role) && (
            <>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="quotas">Leave Quotas ({leaveBalances.length})</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {pending.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table style={{ tableLayout: 'fixed' }}>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 pl-4 pr-2 w-[20%]">Employee</TableHead>
                        <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-2 w-[12%]">Type</TableHead>
                        <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-2 w-[26%]">Dates</TableHead>
                        <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-2 w-[9%] text-right">Days</TableHead>
                        <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-2 w-[20%]">Reason</TableHead>
                        <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 pr-4 pl-2 w-[13%]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pending.map((leave) => (
                        <TableRow key={leave.id} className="border-b border-border/30">
                          <TableCell className="py-2.5 pl-4 pr-2 overflow-hidden">
                            <div className="truncate">
                              <p className="font-medium text-sm truncate">{leave.employee?.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {leave.employee?.employee_code ?? leave.employee?.designation}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 px-2 text-sm truncate overflow-hidden">{LEAVE_TYPE_LABELS[leave.leave_type]}</TableCell>
                          <TableCell className="py-2.5 px-2 text-sm overflow-hidden">
                            <div className="truncate">{formatDate(leave.start_date)} – {formatDate(leave.end_date)}</div>
                          </TableCell>
                          <TableCell className="py-2.5 px-2 text-right tabular-nums font-semibold overflow-hidden">{leave.days_count}</TableCell>
                          <TableCell className="py-2.5 px-2 truncate text-sm text-muted-foreground overflow-hidden max-w-0">{leave.reason}</TableCell>
                          <TableCell className="py-2.5 pr-4 pl-2 overflow-hidden">
                            <LeaveActions leaveId={leave.id} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
                <div className="overflow-x-auto">
                  <Table style={{ tableLayout: 'fixed' }}>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 pl-4 pr-2 w-[24%]">Employee</TableHead>
                        <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-2 w-[13%]">Type</TableHead>
                        <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-2 w-[26%]">Dates</TableHead>
                        <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-2 w-[11%] text-right">Days</TableHead>
                        <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 pr-4 pl-2 w-[26%]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processed.map((leave) => (
                        <React.Fragment key={leave.id}>
                          <TableRow className="border-b border-border/30">
                            <TableCell className="py-2.5 pl-4 pr-2 font-medium text-sm truncate">{leave.employee?.full_name}</TableCell>
                            <TableCell className="py-2.5 px-2 text-sm truncate">{LEAVE_TYPE_LABELS[leave.leave_type]}</TableCell>
                            <TableCell className="py-2.5 px-2 text-sm">
                              <div className="truncate">{formatDate(leave.start_date)} – {formatDate(leave.end_date)}</div>
                            </TableCell>
                            <TableCell className="py-2.5 px-2 text-right tabular-nums font-semibold">{leave.days_count}</TableCell>
                            <TableCell className="py-2.5 pr-4 pl-2">
                              <Badge className={STATUS_COLORS[leave.status]} variant="secondary">
                                {LEAVE_STATUS_LABELS[leave.status]}
                              </Badge>
                            </TableCell>
                          </TableRow>
                          {leave.status === 'rejected' && leave.rejection_reason && (
                            <TableRow className="border-b border-border/30">
                              <TableCell colSpan={5} className="pt-0 pb-3 pl-4 pr-4">
                                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Rejection Reason:</p>
                                  <p className="text-sm text-red-600 dark:text-red-300">{leave.rejection_reason}</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isAdmin(employee.role) && (
          <TabsContent value="quotas">
            <Card>
              <CardHeader>
                <CardTitle>Leave Quotas Management</CardTitle>
              </CardHeader>
              <CardContent>
                {leaveBalances.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table style={{ tableLayout: 'fixed' }}>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-border/50">
                          <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[28%]">Employee</TableHead>
                          <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[18%] text-right">Annual</TableHead>
                          <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[18%] text-right">Sick</TableHead>
                          <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[18%] text-right">Casual</TableHead>
                          <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[18%]">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaveBalances.map((balance: any) => (
                          <TableRow key={balance.id} className="border-b border-border/30">
                            <TableCell className="py-2.5 px-3">
                              <div>
                                <p className="font-medium text-sm">{balance.employee?.full_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {balance.employee?.employee_code ?? balance.employee?.designation}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="py-2.5 px-3 text-right">
                              <span className="font-mono text-sm font-semibold">{balance.annual_quota}</span>
                              <span className="text-xs text-muted-foreground ml-1">
                                ({balance.annual_used} used)
                              </span>
                            </TableCell>
                            <TableCell className="py-2.5 px-3 text-right">
                              <span className="font-mono text-sm font-semibold">{balance.sick_quota}</span>
                              <span className="text-xs text-muted-foreground ml-1">
                                ({balance.sick_used} used)
                              </span>
                            </TableCell>
                            <TableCell className="py-2.5 px-3 text-right">
                              <span className="font-mono text-sm font-semibold">{balance.casual_quota}</span>
                              <span className="text-xs text-muted-foreground ml-1">
                                ({balance.casual_used} used)
                              </span>
                            </TableCell>
                            <TableCell className="py-2.5 px-3">
                              <LeaveQuotaAdjuster balance={balance} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No employees found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
