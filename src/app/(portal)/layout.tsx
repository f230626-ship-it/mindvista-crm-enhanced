import { AppShell } from "@/components/layout/app-shell";
import { requireAuth } from "@/lib/auth";
import { Suspense } from "react";
import { PageLoader } from "@/components/ui/page-loader";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const employee = await requireAuth();
  return (
    <AppShell employee={employee}>
      <Suspense fallback={<PageLoader message="Loading content..." />}>
        {children}
      </Suspense>
    </AppShell>
  );
}
