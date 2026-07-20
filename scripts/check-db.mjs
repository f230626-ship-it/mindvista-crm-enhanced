/**
 * check-db.mjs — quick diagnostic: list all employees and auth users
 */
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

const { data: employees } = await supabase
  .from("employees")
  .select("id, employee_code, full_name, email, role, manager_id")
  .order("created_at");

console.log("\n=== EMPLOYEES IN DB ===");
for (const e of employees ?? []) {
  console.log(`  [${e.employee_code ?? "??"}] ${e.full_name} | ${e.email} | role=${e.role}`);
}

const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
console.log("\n=== AUTH USERS IN DB ===");
for (const u of users?.users ?? []) {
  console.log(`  ${u.email} | id=${u.id}`);
}
