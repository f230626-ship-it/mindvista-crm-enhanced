import { createAdminClient } from "@/lib/supabase/admin";
import { requireSalesOwner } from "@/lib/auth";
import { ProfileFormPage } from "@/components/sales/profile-form-page";

export default async function NewProfilePage() {
  await requireSalesOwner();
  const supabase = createAdminClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, email, pm_role")
    .in("pm_role", ["bd", "admin", "coordinator"])
    .eq("status", "active")
    .order("full_name");

  return <ProfileFormPage employees={employees ?? []} />;
}
