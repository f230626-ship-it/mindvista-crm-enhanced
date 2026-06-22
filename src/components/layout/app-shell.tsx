import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { AnimatedPage } from "@/components/ui/animated-page";
import type { Employee } from "@/types/database";

export function AppShell({
  employee,
  children,
}: {
  employee: Employee;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role={employee.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header employee={employee} />
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatedPage>{children}</AnimatedPage>
        </main>
      </div>
    </div>
  );
}
