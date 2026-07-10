/**
 * seed-real-employees.mjs
 *
 * 1. Deletes ALL existing auth users + employee rows (clean slate)
 * 2. Creates Abdullah (admin) fresh
 * 3. Creates the 5 real employees with correct hierarchy
 *
 * Run: node scripts/seed-real-employees.mjs
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

const PASSWORD = "MindVista@Dev2026";

function log(msg) { console.log(`[seed] ${msg}`); }

// ── Step 1: Wipe all auth users ───────────────────────────────────────────────
async function deleteAllUsers() {
  log("Step 1: Deleting ALL auth users…");
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error("listUsers: " + error.message);

  for (const u of data.users) {
    const { error: e } = await supabase.auth.admin.deleteUser(u.id);
    if (e) log(`  ⚠  Could not delete ${u.email}: ${e.message}`);
    else    log(`  🗑  Deleted: ${u.email}`);
  }
  log(`  ✅  Deleted ${data.users.length} auth user(s)`);
}

// ── Step 2: Wipe leftover employee rows (cascade should handle it, but just in case) ─
async function wipeEmployees() {
  log("\nStep 2: Clearing any remaining employee rows…");
  const { error } = await supabase.from("employees").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) log(`  ⚠  ${error.message}`);
  else       log("  ✅  employees table cleared");
}

// ── Step 3: Reset employee_code sequence ─────────────────────────────────────
async function resetSequence() {
  log("\nStep 3: Resetting employee_code sequence to 1…");
  // We'll just assign codes manually below, no RPC needed
  log("  ✅  Will assign codes manually starting from 01");
}

// ── Helper: get or create department ─────────────────────────────────────────
async function getDept(name) {
  const { data } = await supabase.from("departments").select("id").eq("name", name).single();
  if (data) return data.id;
  const { data: ins } = await supabase.from("departments").insert({ name }).select("id").single();
  return ins.id;
}

// ── Helper: create one auth user + employee row ───────────────────────────────
async function createEmployee({ code, full_name, email, designation, role, employment_type, dept, manager_id }) {
  log(`\n  👤  ${full_name} <${email}>`);

  // Auth user
  const { data: u, error: uErr } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (uErr) { log(`     ❌  Auth error: ${uErr.message}`); return null; }
  log(`     ✅  Auth user: ${u.user.id}`);

  // Employee row
  const row = {
    user_id:         u.user.id,
    full_name,
    email,
    designation,
    role,
    employment_type,
    department_id:   dept,
    employee_code:   code,
    joining_date:    new Date().toISOString().split("T")[0],
    status:          "active",
    work_location:   "onsite",
  };
  if (manager_id) row.manager_id = manager_id;

  const { data: emp, error: eErr } = await supabase
    .from("employees").insert(row).select("id").single();

  if (eErr) {
    log(`     ❌  Employee row error: ${eErr.message}`);
    await supabase.auth.admin.deleteUser(u.user.id);
    return null;
  }
  log(`     ✅  Employee row: ${emp.id}  (code: ${code})`);
  return emp.id;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  log("=== MindVista Clean Seed ===\n");

  await deleteAllUsers();
  await wipeEmployees();
  await resetSequence();

  // Resolve departments
  log("\nStep 4: Resolving departments…");
  const engDept  = await getDept("Engineering");
  const opsDept  = await getDept("Operations");
  log(`  Engineering → ${engDept}`);
  log(`  Operations  → ${opsDept}`);

  // ── Create employees in order ─────────────────────────────────────────────
  log("\nStep 5: Creating employees…");

  // 01 — Abdullah (Admin / Lead of all)
  const abdullahId = await createEmployee({
    code:            "01",
    full_name:       "Abdullah Shafiq",
    email:           "mabdullahshafiq100@gmail.com",
    designation:     "CEO / Admin",
    role:            "admin",
    employment_type: "full_time",
    dept:            opsDept,
    manager_id:      null,
  });

  // 02 — Fatima Amer (reports to Abdullah)
  const fatimaId = await createEmployee({
    code:            "02",
    full_name:       "Fatima Amer",
    email:           "faamer003@gmail.com",
    designation:     "Software Engineer",
    role:            "manager",   // she manages Momina
    employment_type: "full_time",
    dept:            engDept,
    manager_id:      abdullahId,
  });

  // 03 — Momina Waqar (reports to Fatima, lead = Abdullah)
  await createEmployee({
    code:            "03",
    full_name:       "Momina Waqar",
    email:           "mominawaqar18@gmail.com",
    designation:     "Assistant Software Engineer",
    role:            "employee",
    employment_type: "full_time",
    dept:            engDept,
    manager_id:      fatimaId,
  });

  // 04 — Faizan Mehmood (reports to Abdullah)
  await createEmployee({
    code:            "04",
    full_name:       "Faizan Mehmood",
    email:           "work.faizan81@gmail.com",
    designation:     "Assistant Business Developer",
    role:            "employee",
    employment_type: "full_time",
    dept:            opsDept,
    manager_id:      abdullahId,
  });

  // 05 — Asim Ali (reports to Abdullah)
  await createEmployee({
    code:            "05",
    full_name:       "Asim Ali",
    email:           "asimtassaduqwork@gmail.com",
    designation:     "Assistant Business Developer",
    role:            "employee",
    employment_type: "full_time",
    dept:            opsDept,
    manager_id:      abdullahId,
  });

  // 06 — Abdullah Haroon (intern, reports to Abdullah)
  await createEmployee({
    code:            "06",
    full_name:       "Abdullah Haroon",
    email:           "abdullahharoon681@gmail.com",
    designation:     "Intern Business Developer",
    role:            "employee",
    employment_type: "intern",
    dept:            opsDept,
    manager_id:      abdullahId,
  });

  // ── Final summary ─────────────────────────────────────────────────────────
  log("\n=== Final Employee List ===");
  const { data: final } = await supabase
    .from("employees")
    .select("employee_code, full_name, email, designation, role, employment_type")
    .order("employee_code");

  for (const e of final ?? []) {
    log(`  [${e.employee_code}] ${e.full_name} | ${e.designation} | ${e.role} | ${e.email}`);
  }

  log(`\n✅  All done! Password for all accounts: ${PASSWORD}`);
}

main().catch((e) => { console.error("❌ Fatal:", e); process.exit(1); });
