import { getSalesAlerts } from "@/actions/sales-analytics";
import { requireSalesAccess } from "@/lib/auth";
import { SalesAlertsClient } from "@/components/sales/sales-alerts-client";

export default async function SalesAlertsPage() {
  await requireSalesAccess();
  const { alerts, error } = await getSalesAlerts();
  return <SalesAlertsClient alerts={alerts} error={error} />;
}
