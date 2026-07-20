import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function run() {
  console.log("Fetching current departments...");
  const { data: depts, error: fetchErr } = await supabase.from("departments").select("*");
  if (fetchErr) throw fetchErr;

  let engineeringId = depts.find(d => d.name === "Engineering")?.id;
  let bizDevId = depts.find(d => d.name === "Business Developer")?.id;

  // Create Business Developer if it doesn't exist
  if (!bizDevId) {
    console.log("Creating Business Developer department...");
    const { data: newDept, error: insertErr } = await supabase
      .from("departments")
      .insert({ name: "Business Developer", description: "Business growth and partnerships" })
      .select()
      .single();
    if (insertErr) throw insertErr;
    bizDevId = newDept.id;
  }
  
  // Create Engineering if it doesn't exist (though it should)
  if (!engineeringId) {
    console.log("Creating Engineering department...");
    const { data: newDept, error: insertErr } = await supabase
      .from("departments")
      .insert({ name: "Engineering", description: "Software development and technical operations" })
      .select()
      .single();
    if (insertErr) throw insertErr;
    engineeringId = newDept.id;
  }

  // Get departments to delete
  const idsToKeep = [engineeringId, bizDevId];
  const deptsToDelete = depts.filter(d => !idsToKeep.includes(d.id));

  console.log(`Reassigning employees from old departments to Business Developer...`);
  for (const dept of deptsToDelete) {
    const { error: updateErr } = await supabase
      .from("employees")
      .update({ department_id: bizDevId })
      .eq("department_id", dept.id);
    if (updateErr) throw updateErr;
  }

  console.log(`Deleting ${deptsToDelete.length} old departments...`);
  if (deptsToDelete.length > 0) {
    const { error: deleteErr } = await supabase
      .from("departments")
      .delete()
      .in("id", deptsToDelete.map(d => d.id));
    if (deleteErr) throw deleteErr;
  }

  console.log("Successfully updated departments to only 'Engineering' and 'Business Developer'.");
}

run().catch(console.error);
