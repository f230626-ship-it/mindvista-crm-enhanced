import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { CheckInOut } from "@/components/attendance/check-in-out";
import { TimesheetForm } from "@/components/attendance/timesheet-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ATTENDANCE_TYPE_LABELS } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { startOfMonth, endOfMonth, format } from "date-fns";

export default async function AttendancePage() {
  const employee = await requireAuth();
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const [{ data: todayRecord }, { data: records }, { data: timesheets }] = await Promise.all([
    supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", employee.id)
      .eq("date", today)
      .maybeSingle(),
    supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", employee.id)
      .gte("date", monthStart)
      .lte("date", monthEnd)
      .order("date", { ascending: false }),
    supabase
      .from("timesheets")
      .select("*")
      .eq("employee_id", employee.id)
      .gte("date", monthStart)
      .lte("date", monthEnd)
      .order("date", { ascending: false })
      .limit(10),
  ]);

  const totalHours = records?.reduce((sum, r) => sum + (r.working_hours ?? 0), 0) ?? 0;
  const presentDays = records?.filter((r) => r.check_in).length ?? 0;

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Track your daily attendance and timesheets"
        action={<CheckInOut todayRecord={todayRecord} />}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{presentDays} days</p>
            <p className="text-xs text-muted-foreground">Days present</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {todayRecord?.check_in ? (todayRecord.check_out ? "Complete" : "Active") : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {todayRecord?.check_in ? formatDateTime(todayRecord.check_in) : "Not checked in"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {records && records.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{formatDate(record.date)}</TableCell>
                      <TableCell>
                        {record.check_in ? formatDate(record.check_in, "h:mm a") : "—"}
                      </TableCell>
                      <TableCell>
                        {record.check_out ? formatDate(record.check_out, "h:mm a") : "—"}
                      </TableCell>
                      <TableCell>{record.working_hours ?? "—"}</TableCell>
                      <TableCell>{ATTENDANCE_TYPE_LABELS[record.attendance_type]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No attendance records this month</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Timesheets</CardTitle>
            <TimesheetForm />
          </CardHeader>
          <CardContent>
            {timesheets && timesheets.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timesheets.map((ts) => (
                    <TableRow key={ts.id}>
                      <TableCell>{formatDate(ts.date)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{ts.task_description}</TableCell>
                      <TableCell>{ts.hours}h</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No timesheet entries yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
