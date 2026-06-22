import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
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
import { formatDate } from "@/lib/utils/date";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { Users, Clock, AlertTriangle } from "lucide-react";

export default async function AdminAttendancePage() {
  await requireRole("admin", "manager");
  const supabase = await createClient();

  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const today = format(new Date(), "yyyy-MM-dd");

  const [{ data: records }, { data: todayRecords }, { count: employeeCount }] = await Promise.all([
    supabase
      .from("attendance")
      .select("*, employee:employees(full_name, email)")
      .gte("date", monthStart)
      .lte("date", monthEnd)
      .order("date", { ascending: false }),
    supabase
      .from("attendance")
      .select("*, employee:employees(full_name)")
      .eq("date", today),
    supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  const presentToday = todayRecords?.filter((r) => r.check_in).length ?? 0;
  const lateArrivals =
    records?.filter((r) => {
      if (!r.check_in) return false;
      const hour = new Date(r.check_in).getHours();
      return hour >= 10;
    }).length ?? 0;

  const avgHours =
    records && records.length > 0
      ? records.reduce((sum, r) => sum + (r.working_hours ?? 0), 0) / records.length
      : 0;

  return (
    <div>
      <PageHeader
        title="Attendance Reports"
        description="Monitor team attendance and working hours"
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard
          title="Present Today"
          value={`${presentToday}/${employeeCount ?? 0}`}
          description="Employees checked in"
          icon={Users}
        />
        <StatCard
          title="Avg Hours/Day"
          value={avgHours.toFixed(1)}
          description="This month"
          icon={Clock}
        />
        <StatCard
          title="Late Arrivals"
          value={lateArrivals}
          description="After 10:00 AM this month"
          icon={AlertTriangle}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Attendance Log</CardTitle>
        </CardHeader>
        <CardContent>
          {records && records.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.slice(0, 50).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.employee?.full_name}</TableCell>
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
    </div>
  );
}
