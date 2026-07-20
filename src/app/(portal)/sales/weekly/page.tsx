import { getWeeklyReportData } from "@/actions/sales";
import { requireSalesOwner } from "@/lib/auth";
import { WeeklyReportClient } from "@/components/sales/weekly-report-client";

export default async function WeeklyReportPage() {
  await requireSalesOwner();
  const data = await getWeeklyReportData();
  return <WeeklyReportClient data={data} />;
}
