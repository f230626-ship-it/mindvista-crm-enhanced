"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, Phone, Briefcase, Building2 } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";

interface HierarchyEmployee {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  designation: string;
  role: string;
  profile_photo_url: string | null;
  employee_code: string | null;
}

interface DepartmentWithEmployees {
  id: string;
  name: string;
  employees: HierarchyEmployee[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TeamHierarchyDirectory({
  departments,
}: {
  departments: DepartmentWithEmployees[];
}) {
  const [search, setSearch] = useState("");

  const filteredDepartments = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return departments;

    return departments
      .map((dept) => ({
        ...dept,
        employees: dept.employees.filter(
          (emp) =>
            emp.full_name.toLowerCase().includes(term) ||
            emp.employee_code?.toLowerCase().includes(term) ||
            emp.designation?.toLowerCase().includes(term) ||
            emp.email?.toLowerCase().includes(term)
        ),
      }))
      .filter((dept) => dept.employees.length > 0);
  }, [departments, search]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, employee ID, or designation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredDepartments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No matches found</p>
            <p className="text-sm text-muted-foreground">Try a different search term</p>
          </CardContent>
        </Card>
      ) : (
        filteredDepartments.map((department) => (
          <Card key={department.id} className="overflow-hidden pt-0">
            <CardHeader className="border-b bg-muted/30 py-(--card-spacing)">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{department.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {department.employees.length}{" "}
                      {department.employees.length === 1 ? "member" : "members"}
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
                {department.employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 shrink-0 ring-2 ring-border/60 transition-all group-hover:ring-primary/40">
                        <AvatarImage src={employee.profile_photo_url ?? undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/25 to-primary/10 font-semibold text-primary">
                          {getInitials(employee.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold leading-tight">
                          {employee.full_name}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {employee.employee_code && (
                            <span className="font-mono text-[10px] text-muted-foreground/70">
                              #{employee.employee_code}
                            </span>
                          )}
                          <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal text-muted-foreground">
                            {ROLE_LABELS[employee.role] ?? employee.role}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 border-t border-border/50 pt-3">
                      <div className="flex items-center gap-2 text-xs">
                        <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate font-medium">{employee.designation}</span>
                      </div>
                      {employee.email && (
                        <div className="flex items-center gap-2 text-xs">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <a
                            href={`mailto:${employee.email}`}
                            className="truncate hover:text-primary hover:underline"
                          >
                            {employee.email}
                          </a>
                        </div>
                      )}
                      {employee.phone && (
                        <div className="flex items-center gap-2 text-xs">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <a
                            href={`tel:${employee.phone}`}
                            className="truncate hover:text-primary hover:underline"
                          >
                            {employee.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
