import { AppShellClient } from "@/components/layout/app-shell-client";
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
    <AppShellClient
      employee={employee}
      notifications={notifications}
      unreadCount={unreadCount}
    >
      {children}
    </AppShellClient>
  );
}
