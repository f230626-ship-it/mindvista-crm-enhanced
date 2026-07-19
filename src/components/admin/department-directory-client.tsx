"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";

interface DepartmentRow {
  id: string;
  name: string;
}

interface EmployeeRow {
  id: string;
  full_name: string;
  employee_code: string | null;
  designation: string;
  role: string;
  profile_photo_url: string | null;
  department_id: string | null;
  manager_id: string | null;
}

const UNASSIGNED_ID = "unassigned";

const DEPARTMENT_DOT: Record<string, string> = {
  Engineering: "bg-blue-500",
  Design: "bg-pink-500",
  Finance: "bg-emerald-500",
  "Human Resources": "bg-amber-500",
  Operations: "bg-cyan-500",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function DepartmentDirectoryClient({
  departments,
  employees,
}: {
  departments: DepartmentRow[];
  employees: EmployeeRow[];
}) {
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const buckets = useMemo(() => {
    const list = [...departments, { id: UNASSIGNED_ID, name: "Unassigned" }];

    return list.map((dept) => {
      const members = employees.filter((e) =>
        dept.id === UNASSIGNED_ID ? !e.department_id : e.department_id === dept.id
      );
      const memberIds = new Set(members.map((m) => m.id));

      // Derive a department "lead" as the member who is the manager of the
      // most other members within the same department.
      const reportCounts = new Map<string, number>();
      for (const m of members) {
        if (m.manager_id && memberIds.has(m.manager_id)) {
          reportCounts.set(m.manager_id, (reportCounts.get(m.manager_id) ?? 0) + 1);
        }
      }
      let lead: EmployeeRow | null = null;
      let maxReports = 0;
      for (const [managerId, count] of reportCounts) {
        if (count > maxReports) {
          maxReports = count;
          lead = members.find((m) => m.id === managerId) ?? null;
        }
      }

      return { ...dept, members, lead };
    });
  }, [departments, employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      const bucketId = e.department_id ?? UNASSIGNED_ID;
      const matchesDept = !selectedDept || bucketId === selectedDept;
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        e.full_name.toLowerCase().includes(term) ||
        e.employee_code?.toLowerCase().includes(term) ||
        e.designation?.toLowerCase().includes(term) ||
        (ROLE_LABELS[e.role] ?? e.role).toLowerCase().includes(term);
      return matchesDept && matchesSearch;
    });
  }, [employees, search, selectedDept]);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, employee ID, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Department summary cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        {buckets.map((dept) => {
          const isActive = selectedDept === dept.id;
          const dotColor = DEPARTMENT_DOT[dept.name] ?? "bg-slate-400";
          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => setSelectedDept(isActive ? null : dept.id)}
              className={cn(
                "text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl",
                "hover:-translate-y-0.5"
              )}
            >
              <Card
                className={cn(
                  "h-full border-border/60 pt-0 transition-all",
                  isActive && "border-primary/50 ring-2 ring-primary/30"
                )}
              >
                <div className="flex items-center gap-2 border-b border-border/50 py-(--card-spacing) px-4">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", dotColor)} />
                  <span className="truncate text-sm font-medium">{dept.name}</span>
                </div>
                <CardContent className="space-y-1.5 pt-4">
                  <p className="text-2xl font-bold tracking-tight">{dept.members.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {dept.members.length === 1 ? "member" : "members"}
                  </p>
                  <div className="flex items-center gap-1.5 pt-1 text-xs">
                    {dept.lead ? (
                      <>
                        <Crown className="h-3 w-3 shrink-0 text-purple-500" />
                        <span className="truncate font-medium text-foreground">
                          {dept.lead.full_name}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground/70">No lead identified</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {/* Member directory */}
      {filteredEmployees.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No members found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or department filter
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
          {filteredEmployees.map((emp) => {
            const deptName =
              buckets.find((b) =>
                emp.department_id ? b.id === emp.department_id : b.id === UNASSIGNED_ID
              )?.name ?? "Unassigned";
            const dotColor = DEPARTMENT_DOT[deptName] ?? "bg-slate-400";

            return (
              <Card
                key={emp.id}
                className="group border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <CardContent className="flex items-start gap-3">
                  <Avatar className="h-11 w-11 shrink-0 ring-2 ring-border/60 transition-all group-hover:ring-primary/40">
                    <AvatarImage src={emp.profile_photo_url ?? undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/25 to-primary/10 font-semibold text-primary">
                      {getInitials(emp.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-semibold leading-tight">
                      {emp.full_name}
                    </p>
                    <p className="truncate text-xs leading-tight text-muted-foreground">
                      {emp.designation}
                    </p>
                    {emp.employee_code && (
                      <p className="font-mono text-[10px] text-muted-foreground/70">
                        #{emp.employee_code}
                      </p>
                    )}
                    <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[10px]">
                      <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
                      {deptName}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
