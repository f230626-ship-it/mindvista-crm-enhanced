import { getCommandCenterDataWithSnapshots } from "@/actions/sales";
import { requireSalesOwner } from "@/lib/auth";
import { CommandCenterClient } from "@/components/sales/command-center-client";

export default async function CommandCenterPage() {
  await requireSalesOwner();
  const data = await getCommandCenterDataWithSnapshots();
  return <CommandCenterClient data={data} />;
}
