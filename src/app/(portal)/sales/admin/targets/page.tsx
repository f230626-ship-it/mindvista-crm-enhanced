import { createClient } from "@/lib/supabase/server";
import { requireSalesOwner } from "@/lib/auth";
import { TargetsPageClient } from "@/components/sales/targets-page-client";

export default async function AdminTargetsPage() {
  await requireSalesOwner();
  const supabase = await createClient();

  const [{ data: employees }, { data: targets }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, email, pm_role")
      .in("pm_role", ["bd", "admin", "coordinator"])
      .eq("status", "active")
      .order("full_name"),
    supabase.from("sales_targets").select("*"),
  ]);

  return <TargetsPageClient employees={employees ?? []} targets={targets ?? []} />;
}
