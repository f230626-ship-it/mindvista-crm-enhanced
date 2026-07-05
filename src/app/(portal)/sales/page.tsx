import { redirect } from "next/navigation";
import { requireSalesAccess, isSalesOwner } from "@/lib/auth";

export default async function SalesIndexPage() {
  const employee = await requireSalesAccess();
  if (isSalesOwner(employee.role)) redirect("/sales/command");
  redirect("/sales/my-day");
}
