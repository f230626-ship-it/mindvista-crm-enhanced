import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();

  // First check if columns exist
  const { data, error } = await supabase.from("projects").select("id").limit(1);

  if (error) {
    return NextResponse.json({ step: "baseline", error: error.message });
  }

  // Try inserting with priority and progress_percentage to see if columns exist
  const testRow = data?.[0];
  if (!testRow) {
    return NextResponse.json({ step: "no_projects", message: "No projects in DB" });
  }

  // Try selecting priority
  const { error: pErr } = await supabase.from("projects").select("id, priority").limit(1);
  const hasPriority = !pErr;

  const { error: ppErr } = await supabase.from("projects").select("id, progress_percentage").limit(1);
  const hasProgress = !ppErr;

  return NextResponse.json({
    hasPriority,
    hasProgress,
    priorityError: pErr?.message,
    progressError: ppErr?.message,
  });
}
