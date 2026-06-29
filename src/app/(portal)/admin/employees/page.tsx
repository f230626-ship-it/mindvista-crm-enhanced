import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { EmployeeForm } from "@/components/admin/employee-form";
import { EditEmployeeDialog } from "@/components/admin/edit-employee-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  EMPLOYEE_STATUS_LABELS,
} from "@/lib/constants";

export default async function AdminEmployeesPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const [{ data: employees }, { data: departments }, { data: managers }] = await Promise.all([
    supabase
      .from("employees")
      .select("*, department:departments(name), manager:employees!manager_id(full_name)")
      .order("full_name"),
    supabase.from("departments").select("*").order("name"),
    supabase
      .from("employees")
      .select("id, full_name, employee_code")
      .eq("status", "active")
      .order("full_name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Employee Management"
        description="Create and manage employee records"
        action={
          <EmployeeForm
            departments={departments ?? []}
            managers={managers ?? []}
          />
        }
      />

      {/* Modern Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees?.map((emp) => {
          const initials = emp.full_name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <Card key={emp.id} className="relative overflow-hidden shadow-md rounded-xl bg-card border-border/60">
              {/* Action Button (Absolute) */}
              <div className="absolute top-4 right-4">
                <EditEmployeeDialog
                  employee={emp}
                  departments={departments ?? []}
                  managers={managers ?? []}
                />
              </div>

              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="h-14 w-14 border-2 border-primary/20">
                    <AvatarImage src={emp.profile_photo_url ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 pr-8">
                    <h3 className="font-bold text-lg truncate leading-tight">{emp.full_name}</h3>
                    <p className="text-sm text-muted-foreground truncate leading-tight mt-1">{emp.designation}</p>
                    <div className="mt-2">
                      <Badge variant={emp.status === "active" ? "default" : "outline"} className="text-[10px] px-1.5 py-0.5">
                        {EMPLOYEE_STATUS_LABELS[emp.status]}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm border-t border-border/40 pt-4 mt-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-0.5 tracking-wider">Employee ID</p>
                    <p className="font-mono font-medium">{emp.employee_code ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-0.5 tracking-wider">Department</p>
                    <p className="truncate font-medium">{emp.department?.name ?? "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-0.5 tracking-wider">Manager</p>
                    <p className="truncate font-medium">{emp.manager?.full_name ?? "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {employees?.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No employees found.
          </div>
        )}
      </div>
    </div>
  );
}
