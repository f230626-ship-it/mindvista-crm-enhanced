import { AppShell } from "@/components/layout/app-shell";
import { requireAuth } from "@/lib/auth";
import { getNotifications, getUnreadNotificationCount } from "@/actions/notifications";
import { Suspense } from "react";
import { PageLoader } from "@/components/ui/page-loader";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const employee = await requireAuth();
  const [notifications, unreadCount] = await Promise.all([
    getNotifications(),
    getUnreadNotificationCount(),
  ]);

  return (
    <AppShell employee={employee} notifications={notifications} unreadCount={unreadCount}>
      <Suspense fallback={<PageLoader message="Loading content..." />}>
        {children}
      </Suspense>
    </AppShell>
  );
}
