import { createAdminClient } from "@/lib/supabase/admin";
import { requireSalesOwner } from "@/lib/auth";
import { ProfileFormPage } from "@/components/sales/profile-form-page";

export default async function NewProfilePage() {
  await requireSalesOwner();
  const supabase = createAdminClient();

  const [{ data: employees }, { data: teams }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, email, pm_role")
      .in("pm_role", ["bd", "admin", "coordinator"])
      .eq("status", "active")
      .order("full_name"),
    supabase
      .from("sales_teams")
      .select("id, name")
      .eq("status", "active")
      .is("deleted_at", null)
      .order("name"),
  ]);

  return <ProfileFormPage employees={employees ?? []} teams={teams ?? []} />;
}
