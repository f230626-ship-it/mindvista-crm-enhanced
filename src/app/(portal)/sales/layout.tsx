import { requireSalesAccess } from "@/lib/auth";
import { SalesShell } from "@/components/sales/sales-shell";

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  const employee = await requireSalesAccess();
  return <SalesShell employee={employee}>{children}</SalesShell>;
}
