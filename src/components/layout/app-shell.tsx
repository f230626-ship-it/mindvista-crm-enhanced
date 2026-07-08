import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { AnimatedPage } from "@/components/ui/animated-page";
import type { Employee, Notification } from "@/types/database";

export function AppShell({
  employee,
  notifications,
  unreadCount,
  children,
}: {
  employee: Employee;
  notifications: Notification[];
  unreadCount: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role={employee.role} pmRole={employee.pm_role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header employee={employee} notifications={notifications} unreadCount={unreadCount} />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-background">
          <AnimatedPage>{children}</AnimatedPage>
        </main>
      </div>
    </div>
  );
}
