import { createAdminClient } from "@/lib/supabase/admin";
import { requireSalesOwner } from "@/lib/auth";
import { TargetsPageClient } from "@/components/sales/targets-page-client";

export default async function AdminTargetsPage() {
  await requireSalesOwner();
  const supabase = createAdminClient();

  const [{ data: employees }, { data: targets }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, email, designation")
      .eq("status", "active")
      .order("full_name"),
    supabase.from("sales_targets").select("*"),
  ]);

  // Filter for Business Developers by designation
  const bdEmployees = employees?.filter(emp => {
    const d = (emp.designation || "").toLowerCase();
    return d.includes("business developer") || d.includes("bd");
  }) ?? [];

  return <TargetsPageClient employees={bdEmployees} targets={targets ?? []} />;
}
