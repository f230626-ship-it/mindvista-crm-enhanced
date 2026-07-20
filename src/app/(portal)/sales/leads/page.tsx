import { getSalesLeads } from "@/actions/sales-leads";
import { requireSalesAccess } from "@/lib/auth";
import { SalesLeadsClient } from "@/components/sales/sales-leads-client";

export default async function SalesLeadsPage() {
  await requireSalesAccess();
  const { leads, error } = await getSalesLeads();
  return <SalesLeadsClient leads={leads} error={error} />;
}
