"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { EditEmployeeDialog } from "@/components/admin/edit-employee-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EMPLOYEE_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Department, Employee } from "@/types/database";

const ITEMS_PER_PAGE = 8;

export type EmployeeWithRelations = Employee & {
  department?: Pick<Department, "name"> | null;
  manager?: Pick<Employee, "id" | "full_name" | "employee_code"> | null;
  lead?: Pick<Employee, "id" | "full_name" | "employee_code"> | null;
};

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export function EmployeesClient({
  employees,
  departments,
  managers,
}: {
  employees: EmployeeWithRelations[];
  departments: Department[];
  managers: Pick<Employee, "id" | "full_name" | "employee_code">[];
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(employees.length / ITEMS_PER_PAGE));

  const safePage = Math.min(currentPage, totalPages);

  const paginatedEmployees = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return employees.slice(start, start + ITEMS_PER_PAGE);
  }, [employees, safePage]);

  const pageNumbers = getPageNumbers(safePage, totalPages);

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {paginatedEmployees.map((emp) => {
          const initials = emp.full_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <Card
              key={emp.id}
              className="emp-card group relative flex flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-border/50 bg-card shadow-md transition-shadow duration-300 hover:shadow-lg"
            >
              <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 opacity-80 transition-opacity group-hover:opacity-100 flex items-center gap-1">
                <Link
                  href={`/admin/employees/${emp.id}`}
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                  aria-label={`View ${emp.full_name}`}
                >
                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Link>
                <EditEmployeeDialog
                  employee={emp}
                  managers={managers}
                  departments={departments}
                />
              </div>

              <CardContent className="flex flex-1 flex-col items-center px-4 sm:px-6 pb-4 sm:pb-6 pt-6 sm:pt-8 text-center">
                <Avatar className="mb-3 sm:mb-4 h-16 w-16 sm:h-20 sm:w-20 border-[2px] sm:border-[3px] border-primary/20 shadow-sm">
                  <AvatarImage src={emp.profile_photo_url ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-lg sm:text-xl font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <h3 className="max-w-full truncate text-base sm:text-lg font-bold leading-tight tracking-tight">
                  {emp.full_name}
                </h3>
                <p className="mt-0.5 sm:mt-1 max-w-full truncate text-xs sm:text-sm text-muted-foreground">
                  {emp.designation}
                </p>

                <div className="mt-2 sm:mt-3">
                  <Badge
                    variant={emp.status === "active" ? "default" : "outline"}
                    className="px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-medium"
                  >
                    {EMPLOYEE_STATUS_LABELS[emp.status]}
                  </Badge>
                </div>

                <div className="mt-auto w-full space-y-2 sm:space-y-3 border-t border-border/40 pt-4 sm:pt-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="min-w-0">
                      <p className="mb-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Employee ID
                      </p>
                      <p className="truncate font-mono font-semibold text-foreground">
                        {emp.employee_code ?? "—"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="mb-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Department
                      </p>
                      <p className="truncate font-medium">{emp.department?.name ?? "—"}</p>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="mb-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Lead
                    </p>
                    <p className="truncate font-medium">{emp.lead?.full_name ?? "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {employees.length === 0 && (
          <div className="col-span-full py-12 sm:py-16 text-center text-muted-foreground">
            No employees found.
          </div>
        )}
      </div>

      {employees.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:gap-4 border-t border-border/40 pt-3 sm:pt-4 sm:flex-row">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(safePage * ITEMS_PER_PAGE, employees.length)} of {employees.length}{" "}
            employees
          </p>

          {totalPages > 1 && (
            <div className="emp-pagination flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={safePage === 1}
                className="emp-pagination-btn h-8 w-8 sm:h-9 sm:w-9"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>

              {pageNumbers.map((page, idx) =>
                page === "ellipsis" ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-xs sm:text-sm">
                    …
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={page === safePage ? "default" : "outline"}
                    size="icon"
                    onClick={() => setCurrentPage(page)}
                    className={
                      page === safePage ? "emp-pagination-current h-8 w-8 sm:h-9 sm:w-9" : "emp-pagination-btn h-8 w-8 sm:h-9 sm:w-9"
                    }
                    aria-label={`Page ${page}`}
                    aria-current={page === safePage ? "page" : undefined}
                  >
                    {page}
                  </Button>
                )
              )}

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={safePage === totalPages}
                className="emp-pagination-btn h-8 w-8 sm:h-9 sm:w-9"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
