import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();

  // Check which new tables exist
  const tables = [
    "sales_teams",
    "sales_team_members",
    "sales_leads",
    "sales_meetings",
    "sales_activity_logs",
    "weekly_reports",
  ];

  const results: Record<string, boolean> = {};

  for (const table of tables) {
    const { error } = await supabase.from(table).select("id").limit(1);
    results[table] = !error;
  }

  // Check new columns on existing tables
  const { error: lgErr } = await supabase.from("sales_daily_logs").select("screenshot").limit(1);
  results["sales_daily_logs.screenshot"] = !lgErr;

  const { error: tgErr } = await supabase.from("sales_targets").select("monthly_goal").limit(1);
  results["sales_targets.monthly_goal"] = !tgErr;

  const { error: prErr } = await supabase.from("sales_profiles").select("linkedin_email").limit(1);
  results["sales_profiles.linkedin_email"] = !prErr;

  return NextResponse.json(results);
}
