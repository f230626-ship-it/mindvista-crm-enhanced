/**
 * Ensure an employee has role=admin (for full Sales owner + Management access).
 *
 * Usage:
 *   node scripts/fix-admin-role.mjs --email dev@mindvista.io
 */

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

const email = parseArgs(process.argv.slice(2)).email;
if (!email) {
  console.error("Usage: node scripts/fix-admin-role.mjs --email <email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

const beforeRes = await fetch(
  `${url}/rest/v1/employees?email=eq.${encodeURIComponent(email)}&select=id,full_name,email,role,pm_role,designation`,
  { headers }
);
const beforeRows = await beforeRes.json();
const before = beforeRows[0];

if (!before) {
  console.error(`No employee found for ${email}`);
  process.exit(1);
}

const updateRes = await fetch(
  `${url}/rest/v1/employees?email=eq.${encodeURIComponent(email)}`,
  {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({ role: "admin", pm_role: "admin" }),
  }
);

if (!updateRes.ok) {
  const err = await updateRes.text();
  console.error("Update failed:", err);
  process.exit(1);
}

const updated = (await updateRes.json())[0];
console.log("Before:", before);
console.log("After:", updated);
console.log("\nSign out and sign back in to refresh your session.");
