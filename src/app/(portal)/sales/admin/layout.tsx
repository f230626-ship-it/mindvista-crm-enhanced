import { requireSalesOwner } from "@/lib/auth";

export default async function SalesAdminLayout({ children }: { children: React.ReactNode }) {
  await requireSalesOwner();
  return children;
}
