import { createAdminClient } from "@/lib/supabase/admin";
import { requireSalesOwner } from "@/lib/auth";
import { ProfileFormPage } from "@/components/sales/profile-form-page";
import { notFound } from "next/navigation";

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSalesOwner();
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: profile }, { data: employees }, { data: teams }] = await Promise.all([
    supabase.from("sales_profiles").select("*").eq("id", id).maybeSingle(),
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

  if (!profile) notFound();

  return (
    <ProfileFormPage
      employees={employees ?? []}
      teams={teams ?? []}
      profileId={profile.id}
      initial={{
        name: profile.name,
        employee_id: profile.employee_id,
        platform: profile.platform,
        google_sheet_id: profile.google_sheet_id,
        sheet_tab_name: profile.sheet_tab_name,
        is_active: profile.is_active,
        linkedin_email: profile.linkedin_email,
        linkedin_username: profile.linkedin_username,
        linkedin_url: profile.linkedin_url,
        assigned_team_id: profile.assigned_team_id,
        notes: profile.notes,
      }}
    />
  );
}
