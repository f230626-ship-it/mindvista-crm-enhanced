import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Building2, Briefcase, Users, Search } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import type { Employee } from "@/types/database";
import { TeamSearch } from "@/components/team/team-search";

interface DepartmentWithEmployees {
  id: string;
  name: string;
  employees: Pick<
    Employee,
    | "id"
    | "full_name"
    | "email"
    | "phone"
    | "designation"
    | "role"
    | "profile_photo_url"
    | "employee_code"
  >[];
}

export default async function TeamPage() {
  await requireAuth();
  const supabase = await createClient();

  // Get all departments with their employees
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");

  const { data: employees } = await supabase
    .from("employees")
    .select(
      "id, full_name, email, phone, designation, role, profile_photo_url, employee_code, department_id"
    )
    .eq("status", "active")
    .order("full_name");

  // Group employees by department
  const departmentsWithEmployees: DepartmentWithEmployees[] = [];

  // Employees with departments
  departments?.forEach((dept) => {
    const deptEmployees = employees?.filter((emp) => emp.department_id === dept.id) ?? [];
    if (deptEmployees.length > 0) {
      departmentsWithEmployees.push({
        id: dept.id,
        name: dept.name,
        employees: deptEmployees,
      });
    }
  });

  // Employees without departments
  const noDeptEmployees = employees?.filter((emp) => !emp.department_id) ?? [];
  if (noDeptEmployees.length > 0) {
    departmentsWithEmployees.push({
      id: "no-dept",
      name: "Unassigned",
      employees: noDeptEmployees,
    });
  }

  const totalEmployees = employees?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Team Directory</h1>
            <p className="text-muted-foreground">
              Browse {totalEmployees} team members across {departments?.length ?? 0} departments
            </p>
          </div>
        </div>
      </div>

      {/* Search and Stats */}
      <TeamSearch employees={employees ?? []} departments={departmentsWithEmployees} />

      <div className="space-y-6">
        {departmentsWithEmployees.map((department, deptIndex) => (
          <Card key={department.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{department.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {department.employees.length} {department.employees.length === 1 ? 'member' : 'members'}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {department.employees.length} people
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {department.employees.map((employee, empIndex) => {
                  const initials = employee.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <div
                      key={employee.id}
                      className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
                      style={{
                        animationDelay: `${(deptIndex * 100) + (empIndex * 50)}ms`
                      }}
                    >
                      {/* Background Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="relative space-y-4">
                        {/* Avatar Section */}
                        <div className="flex items-start gap-4">
                          <Avatar className="h-16 w-16 ring-2 ring-border group-hover:ring-primary/50 transition-all duration-300 shadow-lg">
                            <AvatarImage src={employee.profile_photo_url ?? undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                              {employee.full_name}
                            </h3>
                            {employee.employee_code && (
                              <p className="text-xs text-muted-foreground font-mono bg-muted/50 rounded px-2 py-1 inline-block">
                                #{employee.employee_code}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Job Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Briefcase className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate font-medium">{employee.designation}</span>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-2">
                          {employee.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-primary shrink-0" />
                              <a
                                href={`mailto:${employee.email}`}
                                className="truncate hover:text-primary hover:underline transition-colors"
                              >
                                {employee.email}
                              </a>
                            </div>
                          )}
                          {employee.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-primary shrink-0" />
                              <a
                                href={`tel:${employee.phone}`}
                                className="truncate hover:text-primary hover:underline transition-colors"
                              >
                                {employee.phone}
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Role Badge */}
                        <div className="flex justify-center pt-2">
                          <Badge 
                            variant="outline" 
                            className="text-xs font-medium bg-primary/5 border-primary/20 group-hover:bg-primary/10 transition-colors"
                          >
                            {ROLE_LABELS[employee.role] ?? employee.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {departmentsWithEmployees.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No team members found</h3>
                  <p className="text-sm text-muted-foreground">
                    There are no active employees in the system
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
