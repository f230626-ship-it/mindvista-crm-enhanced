import { createClient } from "@/lib/supabase/server";
import { requireSalesAccess } from "@/lib/auth";
import { DailyLogPageForm } from "@/components/sales/daily-log-page-form";
import { getProfileLogForToday } from "@/actions/sales";
import { notFound } from "next/navigation";

export default async function MyDayProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const employee = await requireSalesAccess();
  const { profileId } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("sales_profiles")
    .select("id, name, employee_id")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile || (profile.employee_id !== employee.id && employee.role !== "admin")) {
    notFound();
  }

  const existing = await getProfileLogForToday(profileId);

  return (
    <DailyLogPageForm
      profileId={profile.id}
      profileName={profile.name}
      existing={existing}
    />
  );
}
