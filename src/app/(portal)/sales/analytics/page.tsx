import { getSalesAnalytics } from "@/actions/sales-analytics";
import { requireSalesOwner } from "@/lib/auth";
import { SalesAnalyticsClient } from "@/components/sales/sales-analytics-client";

export default async function SalesAnalyticsPage() {
  await requireSalesOwner();
  const data = await getSalesAnalytics();
  return <SalesAnalyticsClient data={data} />;
}
