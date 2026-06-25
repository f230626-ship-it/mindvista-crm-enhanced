const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://celsdouievgvgtdrgcgn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlbHNkb3VpZXZndmd0ZHJnY2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE3MjI4MywiZXhwIjoyMDk2NzQ4MjgzfQ.1Mp-Jlbp-6e7Cm-wwjqSSjYuhrC5BYTz72vm9A6xnFA",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function check() {
  // Check if projects table exists
  const { data, error } = await supabase.from("projects").select("id").limit(1);
  if (error) {
    console.log("projects table status:", error.message);
  } else {
    console.log("projects table exists, rows found:", data?.length ?? 0);
  }

  // Check if pm_role type/column exists via information_schema workaround
  const { data: d2, error: e2 } = await supabase
    .from("employees")
    .select("id, pm_role")
    .limit(1);
  console.log("pm_role column:", e2 ? "MISSING — " + e2.message : "EXISTS");
}

check();
