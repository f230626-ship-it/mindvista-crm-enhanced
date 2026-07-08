/**
 * Create a super admin (auth user + employees row).
 *
 * Usage:
 *   node scripts/create-admin.mjs --email dev@mindvista.io --password "YourPass123!" --name "Dev Admin"
 *
 * Optional: --code MV-DEV-001 --designation "Developer"
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const envPath = resolve(root, ".env.local");
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      args[key] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    }
  }
  return args;
}

loadEnv();

const args = parseArgs(process.argv.slice(2));
const email = args.email;
const password = args.password;
const fullName = args.name || "Super Admin";
const employeeCode = args.code || null;
const designation = args.designation || "System Administrator";

if (!email || !password) {
  console.error(
    "Usage: node scripts/create-admin.mjs --email <email> --password <password> [--name \"Full Name\"] [--code MV-001]"
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existingEmp } = await supabase
  .from("employees")
  .select("id, email")
  .eq("email", email)
  .maybeSingle();

if (existingEmp) {
  console.error(`Employee already exists for ${email}`);
  process.exit(1);
}

const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName },
});

if (authError) {
  console.error("Auth error:", authError.message);
  process.exit(1);
}

const { data: dept } = await supabase
  .from("departments")
  .select("id")
  .eq("name", "Engineering")
  .maybeSingle();

const { data: employee, error: empError } = await supabase
  .from("employees")
  .insert({
    user_id: authData.user.id,
    employee_code: employeeCode,
    full_name: fullName,
    email,
    designation,
    department_id: dept?.id ?? null,
    role: "admin",
    status: "active",
    employment_type: "full_time",
    work_location: "remote",
    joining_date: new Date().toISOString().split("T")[0],
  })
  .select("id, email, role, employee_code")
  .single();

if (empError) {
  await supabase.auth.admin.deleteUser(authData.user.id);
  console.error("Employee insert error:", empError.message);
  process.exit(1);
}

console.log("Super admin created successfully:");
console.log(JSON.stringify({ email, password, employee }, null, 2));
