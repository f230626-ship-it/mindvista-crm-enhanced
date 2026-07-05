import { getMyProgressData } from "@/actions/sales";
import { requireSalesAccess } from "@/lib/auth";
import { MyProgressClient } from "@/components/sales/my-progress-client";

export default async function MyProgressPage() {
  await requireSalesAccess();
  const data = await getMyProgressData();
  return <MyProgressClient data={data} />;
}
