import { getSalesMeetings } from "@/actions/sales-meetings";
import { requireSalesAccess } from "@/lib/auth";
import { SalesMeetingsClient } from "@/components/sales/sales-meetings-client";

export default async function SalesMeetingsPage() {
  await requireSalesAccess();
  const { meetings, error } = await getSalesMeetings();
  return <SalesMeetingsClient meetings={meetings} error={error} />;
}
