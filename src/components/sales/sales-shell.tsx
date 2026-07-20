import type { Employee } from "@/types/database";
import { SalesNav } from "@/components/sales/sales-nav";
import { Sparkles } from "lucide-react";
import { isSalesOwner } from "@/lib/auth";

export function SalesShell({
  employee,
  children,
}: {
  employee: Employee;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-full">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden">
        <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 top-10 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-0 h-40 w-96 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative space-y-6">
        <div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card/90 via-card/70 to-primary/5 p-6 shadow-xl shadow-primary/5 backdrop-blur-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-widest">Sales Performance</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Outreach intelligence
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Track daily activity, pipeline health from Google Sheets, and team momentum — without duplicating ClickUp.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <SalesNav isOwner={isSalesOwner(employee.role)} />
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
