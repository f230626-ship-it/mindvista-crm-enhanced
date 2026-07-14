import { getLogHistory } from "@/actions/sales";
import { requireSalesAccess } from "@/lib/auth";
import { LogHistoryClient } from "@/components/sales/log-history-client";

export default async function LogHistoryPage() {
  await requireSalesAccess();
  const { logs, error } = await getLogHistory();
  return <LogHistoryClient logs={logs} error={error} />;
}
