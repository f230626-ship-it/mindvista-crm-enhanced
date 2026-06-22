import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { EmployeeForm } from "@/components/admin/employee-form";
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
import {
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYEE_STATUS_LABELS,
  ROLE_LABELS,
} from "@/lib/constants";
import { formatDate } from "@/lib/utils/date";

export default async function AdminEmployeesPage() {
  await requireRole("admin", "manager");
  const supabase = await createClient();

  const [{ data: employees }, { data: departments }, { data: managers }] = await Promise.all([
    supabase
      .from("employees")
      .select("*, department:departments(name)")
      .order("full_name"),
    supabase.from("departments").select("*").order("name"),
    supabase
      .from("employees")
      .select("id, full_name")
      .in("role", ["admin", "manager"])
      .eq("status", "active"),
  ]);

  return (
    <div>
      <PageHeader
        title="Employee Management"
        description="Manage employee records and profiles"
        action={
          <EmployeeForm
            departments={departments ?? []}
            managers={managers ?? []}
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All Employees ({employees?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees?.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.full_name}</TableCell>
                  <TableCell>{emp.email}</TableCell>
                  <TableCell>{emp.designation}</TableCell>
                  <TableCell>{emp.department?.name ?? "—"}</TableCell>
                  <TableCell>{EMPLOYMENT_TYPE_LABELS[emp.employment_type]}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ROLE_LABELS[emp.role]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={emp.status === "active" ? "default" : "outline"}
                    >
                      {EMPLOYEE_STATUS_LABELS[emp.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(emp.joining_date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
