import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Building2, Briefcase, Users, Crown, UsersRound } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";
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
  const currentEmployee = await requireAuth();
  const supabase = createAdminClient();

  // Fetch created teams with members
  const { data: createdTeams } = await supabase
    .from("teams")
    .select(`
      *,
      lead:employees!teams_lead_id_fkey(id, full_name, email, profile_photo_url),
      members:team_members(
        id, role,
        employee:employees(id, full_name, email, designation, profile_photo_url, employee_code, status)
      )
    `)
    .in("status", ["active", "inactive"])
    .order("created_at", { ascending: false });

  // Filter active members in each team
  const teams = (createdTeams ?? []).map((t: any) => ({
    ...t,
    members: (t.members ?? []).filter((m: any) => m.employee?.status === "active"),
  }));

  // Get hierarchy-based team
  const { directReports, leadTeam } = await (async () => {
    const { data: allEmployees } = await supabase
      .from("employees")
      .select("id, full_name, designation, employee_code, manager_id, lead_id, status, profile_photo_url")
      .eq("status", "active")
      .order("full_name");

    if (!allEmployees) return { directReports: [], leadTeam: [] };

    const directReports = allEmployees.filter((e) => e.manager_id === currentEmployee.id);
    const leadTeam = allEmployees.filter(
      (e) => e.lead_id === currentEmployee.id && e.manager_id !== currentEmployee.id
    );

    return { directReports, leadTeam };
  })();

  const teamMemberIds = [
    ...directReports.map(e => e.id),
    ...leadTeam.map(e => e.id)
  ];

  const hasCreatedTeams = teams.length > 0;
  const hasHierarchy = teamMemberIds.length > 0;

  if (!hasCreatedTeams && !hasHierarchy) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Team</h1>
              <p className="text-muted-foreground">
                View team members who report to you
              </p>
            </div>
          </div>
        </div>
        <Card>
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No team members</h3>
                <p className="text-sm text-muted-foreground">
                  You don&apos;t currently have any teams or direct reports
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get departments for hierarchy view
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, email, phone, designation, role, profile_photo_url, employee_code, department_id")
    .in("id", teamMemberIds)
    .eq("status", "active")
    .order("full_name");

  const departmentsWithEmployees: DepartmentWithEmployees[] = [];
  departments?.forEach((dept) => {
    const deptEmployees = employees?.filter((emp) => emp.department_id === dept.id) ?? [];
    if (deptEmployees.length > 0) {
      departmentsWithEmployees.push({ id: dept.id, name: dept.name, employees: deptEmployees });
    }
  });
  const noDeptEmployees = employees?.filter((emp) => !emp.department_id) ?? [];
  if (noDeptEmployees.length > 0) {
    departmentsWithEmployees.push({ id: "no-dept", name: "Unassigned", employees: noDeptEmployees });
  }

  const totalHierarchy = employees?.length ?? 0;
  const totalTeamMembers = teams.reduce((sum, t) => sum + t.members.length, 0);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Team</h1>
            <p className="text-muted-foreground">
              {hasCreatedTeams && `${teams.length} team${teams.length !== 1 ? "s" : ""} with ${totalTeamMembers} members`}
              {hasCreatedTeams && hasHierarchy && " · "}
              {hasHierarchy && `${totalHierarchy} direct report${totalHierarchy !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      </div>

      {/* Created Teams Section */}
      {hasCreatedTeams && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UsersRound className="h-5 w-5 text-primary" />
            Organization Teams
          </h2>
          {teams.map((team) => (
            <Card key={team.id} className="overflow-hidden pt-0">
              <div className="h-1.5 w-full" style={{ backgroundColor: team.color || "#3B82F6" }} />
              <CardHeader className="py-(--card-spacing)">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <UsersRound className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{team.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono">{team.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {team.lead && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Crown className="h-3 w-3 text-yellow-500" />
                        Lead: {team.lead.full_name}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {team.members.length} members
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {team.description && (
                  <p className="text-sm text-muted-foreground mb-4">{team.description}</p>
                )}
                <div className="grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
                  {team.members.map((member: any) => {
                    const emp = member.employee;
                    if (!emp) return null;
                    const initials = emp.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                    const isLead = member.role === "lead";

                    return (
                      <div
                        key={member.id}
                        className={`group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 ${
                          isLead ? "border-yellow-300 bg-yellow-50/50 dark:bg-yellow-900/10" : "border-border bg-card"
                        }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative space-y-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 ring-2 ring-border group-hover:ring-primary/50 transition-all">
                              <AvatarImage src={emp.profile_photo_url ?? undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <p className="font-semibold truncate text-sm group-hover:text-primary transition-colors">
                                  {emp.full_name}
                                </p>
                                {isLead && <Crown className="h-3 w-3 text-yellow-500 shrink-0" />}
                              </div>
                              {emp.employee_code && (
                                <p className="text-xs text-muted-foreground font-mono">#{emp.employee_code}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Briefcase className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate font-medium">{emp.designation}</span>
                          </div>
                          {emp.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-primary shrink-0" />
                              <a href={`mailto:${emp.email}`} className="truncate hover:text-primary hover:underline transition-colors">
                                {emp.email}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Hierarchy Section */}
      {hasHierarchy && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Reporting Hierarchy
          </h2>
          {departmentsWithEmployees.map((department) => (
            <Card key={department.id} className="overflow-hidden pt-0">
              <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b py-(--card-spacing)">
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
                <div className="grid gap-4 sm:gap-5 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
                  {department.employees.map((employee) => {
                    const initials = employee.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <div
                        key={employee.id}
                        className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative space-y-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16 ring-2 ring-border group-hover:ring-primary/50 transition-all duration-300 shadow-lg">
                              <AvatarImage src={employee.profile_photo_url ?? undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">{employee.full_name}</h3>
                              {employee.employee_code && (
                                <p className="text-xs text-muted-foreground font-mono bg-muted/50 rounded px-2 py-1 inline-block">#{employee.employee_code}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Briefcase className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate font-medium">{employee.designation}</span>
                          </div>
                          <div className="space-y-2">
                            {employee.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-primary shrink-0" />
                                <a href={`mailto:${employee.email}`} className="truncate hover:text-primary hover:underline transition-colors">{employee.email}</a>
                              </div>
                            )}
                            {employee.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-primary shrink-0" />
                                <a href={`tel:${employee.phone}`} className="truncate hover:text-primary hover:underline transition-colors">{employee.phone}</a>
                              </div>
                            )}
                          </div>
                          <div className="flex justify-center pt-2">
                            <Badge variant="outline" className="text-xs font-medium bg-primary/5 border-primary/20 group-hover:bg-primary/10 transition-colors">
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
        </div>
      )}
    </div>
  );
}
