import { getSalesTeams } from "@/actions/sales-teams";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSalesOwner } from "@/lib/auth";
import { SalesTeamsClient } from "@/components/sales/sales-teams-client";

export default async function SalesTeamsPage() {
  await requireSalesOwner();
  const supabase = createAdminClient();
  const { teams, error } = await getSalesTeams();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, email, designation, employee_code, pm_role")
    .eq("status", "active")
    .or("pm_role.eq.bd,designation.ilike.%BD%,designation.ilike.%Business Development%")
    .order("full_name");

  return <SalesTeamsClient teams={teams} employees={employees ?? []} error={error} />;
}
