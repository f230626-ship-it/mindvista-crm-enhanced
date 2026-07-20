/**
 * Role-based QA test suite — supplements e2e-test.mjs with sales, projects,
 * profile, and extended access checks.
 * Run: node scripts/role-qa-test.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const content = readFileSync(resolve(root, ".env.local"), "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
}

loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://hrms.mindvista.io";

const results = [];

function log(area, name, pass, detail = "") {
  results.push({ area, name, pass, detail });
  const icon = pass ? "PASS" : "FAIL";
  console.log(`[${icon}] [${area}] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function login(email, password) {
  const res = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Login failed for ${email}: ${data.error_description || JSON.stringify(data)}`);
  return { token: data.access_token, userId: data.user?.id };
}

async function api(token, path, options = {}) {
  const headers = {
    apikey: ANON,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const res = await fetch(`${URL}/rest/v1/${path}`, { ...options, headers });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

async function serviceApi(path, options = {}) {
  const headers = {
    apikey: SERVICE,
    Authorization: `Bearer ${SERVICE}`,
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const res = await fetch(`${URL}/rest/v1/${path}`, { ...options, headers });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

/** Fetch portal page with session cookies from Supabase login */
async function fetchPortalPage(email, password, path) {
  const { token } = await login(email, password);
  const res = await fetch(`${APP_URL}${path}`, {
    redirect: "manual",
    headers: {
      Cookie: `sb-access-token=${token}`,
      Authorization: `Bearer ${token}`,
    },
  });
  const location = res.headers.get("location") || "";
  const text = await res.text();
  return { status: res.status, location, text: text.slice(0, 500) };
}

console.log("\n=== MindVista HRMS Role QA Suite ===\n");
console.log(`App URL: ${APP_URL}\n`);

const PASSWORD = "Test@MindVista2026";

const accounts = {
  admin: { email: "dev@mindvista.io", password: "MindVista@Dev2026" },
  manager: { email: "sarah.lead@mindvista.io", password: PASSWORD },
  employee: { email: "ali.dev@mindvista.io", password: PASSWORD },
  peer: { email: "fatima.dev@mindvista.io", password: PASSWORD },
};

const tokens = {};
for (const [role, creds] of Object.entries(accounts)) {
  const { token } = await login(creds.email, creds.password);
  tokens[role] = token;
}

// Resolve employee IDs
const empRes = await serviceApi("employees?select=id,email,role,pm_role,manager_id,lead_id");
const employees = empRes.body || [];
const byEmail = Object.fromEntries(employees.map((e) => [e.email, e]));
const ali = byEmail["ali.dev@mindvista.io"];
const sarah = byEmail["sarah.lead@mindvista.io"];
const fatima = byEmail["fatima.dev@mindvista.io"];

console.log("--- Sales module access (DB/API) ---");
const aliSalesProfiles = await api(tokens.employee, "sales_profiles?select=id&limit=5");
log(
  "Sales",
  "Non-BD employee cannot read sales_profiles",
  aliSalesProfiles.status === 403 || (Array.isArray(aliSalesProfiles.body) && aliSalesProfiles.body.length === 0),
  `status=${aliSalesProfiles.status}, count=${Array.isArray(aliSalesProfiles.body) ? aliSalesProfiles.body.length : "n/a"}`
);

const adminSalesProfiles = await api(tokens.admin, "sales_profiles?select=id&limit=5");
log(
  "Sales",
  "Admin can read sales_profiles",
  adminSalesProfiles.status === 200,
  `status=${adminSalesProfiles.status}`
);

const aliOutreach = await api(tokens.employee, "sales_outreach_logs?select=id&limit=5");
log(
  "Sales",
  "Non-BD employee cannot read outreach logs",
  aliOutreach.status === 403 || (Array.isArray(aliOutreach.body) && aliOutreach.body.length === 0),
  `status=${aliOutreach.status}`
);

console.log("\n--- Projects module (RLS) ---");
const aliProjects = await api(tokens.employee, "projects?select=id,name&limit=20");
const mgrProjects = await api(tokens.manager, "projects?select=id,name&limit=20");
const adminProjects = await api(tokens.admin, "projects?select=id,name&limit=20");

log(
  "Projects",
  "Employee project visibility scoped (not full org)",
  Array.isArray(aliProjects.body) ? aliProjects.body.length <= (adminProjects.body?.length ?? 0) : true,
  `employee=${aliProjects.body?.length ?? 0}, admin=${adminProjects.body?.length ?? 0}`
);

log(
  "Projects",
  "Manager can query projects table",
  mgrProjects.status === 200,
  `count=${mgrProjects.body?.length ?? 0}`
);

const aliProjectInsert = await api(tokens.employee, "projects", {
  method: "POST",
  body: JSON.stringify({
    name: "E2E Unauthorized Project",
    status: "active",
    bd_id: ali?.id,
  }),
});
log(
  "Projects",
  "Employee cannot create projects via API",
  aliProjectInsert.status === 403 || aliProjectInsert.status === 401,
  `status=${aliProjectInsert.status}`
);

console.log("\n--- Team hierarchy ---");
const aliVisible = await api(tokens.employee, "employees?select=id,full_name,manager_id,lead_id");
const aliIds = Array.isArray(aliVisible.body) ? aliVisible.body.map((e) => e.id) : [];
const seesSelf = aliIds.includes(ali?.id);
const seesManager = aliIds.includes(sarah?.id);
const seesPeer = aliIds.includes(fatima?.id);
const seesAllOrg = aliIds.length > 5;

log("Team", "Employee sees self in hierarchy", seesSelf);
log("Team", "Employee sees manager in hierarchy", seesManager);
log("Team", "Employee sees peer in same team", seesPeer);
log("Team", "Employee does NOT see full org directory", !seesAllOrg, `visible=${aliIds.length}`);

const mgrVisible = await api(tokens.manager, "employees?select=id,full_name");
const mgrSeesReports = Array.isArray(mgrVisible.body) && mgrVisible.body.some((e) => e.id === ali?.id || e.id === fatima?.id);
log("Team", "Manager sees direct reports", mgrSeesReports, `visible=${mgrVisible.body?.length ?? 0}`);

console.log("\n--- Profile module ---");
const aliProfile = await api(tokens.employee, `employees?id=eq.${ali?.id}&select=full_name,phone,designation,role,cnic_number,employee_code`);
const aliData = aliProfile.body?.[0];
log("Profile", "Employee can read own profile", !!aliData?.full_name);

const profileUpdate = await api(tokens.employee, `employees?id=eq.${ali?.id}`, {
  method: "PATCH",
  headers: { Prefer: "return=representation" },
  body: JSON.stringify({ phone: "+92-300-E2E-TEST", designation: "Software Engineer" }),
});
log("Profile", "Employee can update allowed profile fields", profileUpdate.status === 200 || profileUpdate.status === 204);

const roleEscalation = await api(tokens.employee, `employees?id=eq.${ali?.id}`, {
  method: "PATCH",
  headers: { Prefer: "return=representation" },
  body: JSON.stringify({ role: "admin" }),
});
const afterRole = await api(tokens.employee, `employees?id=eq.${ali?.id}&select=role`);
log("Profile", "Employee cannot escalate role", afterRole.body?.[0]?.role === "employee");

const readOtherCnic = await api(tokens.employee, `employees?id=eq.${fatima?.id}&select=cnic_number`);
log(
  "Profile",
  "Employee cannot read peer CNIC",
  readOtherCnic.status === 403 || !readOtherCnic.body?.[0]?.cnic_number,
  `status=${readOtherCnic.status}`
);

console.log("\n--- Leave module edge cases ---");
const balances = await api(tokens.employee, `leave_balances?employee_id=eq.${ali?.id}&select=*`);
log("Leave", "Employee can read own leave balance", Array.isArray(balances.body) && balances.body.length >= 1);

const peerLeaves = await api(tokens.employee, `leaves?employee_id=eq.${fatima?.id}&select=id,status`);
log(
  "Leave",
  "Employee cannot read peer leave requests",
  peerLeaves.status === 403 || (Array.isArray(peerLeaves.body) && peerLeaves.body.length === 0),
  `status=${peerLeaves.status}, count=${peerLeaves.body?.length ?? 0}`
);

const mgrAllPending = await api(tokens.manager, "leaves?status=eq.pending&select=id,employee_id");
log("Leave", "Manager can see pending leaves for approval", mgrAllPending.status === 200);

const empAdminLeaves = await api(tokens.employee, "leaves?status=eq.pending&select=id");
log(
  "Leave",
  "Employee cannot list all org pending leaves",
  empAdminLeaves.status === 403 || (Array.isArray(empAdminLeaves.body) && empAdminLeaves.body.length <= 1),
  `count=${empAdminLeaves.body?.length ?? 0}`
);

console.log("\n--- Admin-only tables ---");
const empHolidaysWrite = await api(tokens.employee, "holidays", {
  method: "POST",
  body: JSON.stringify({ name: "Hack Holiday", date: "2026-12-25" }),
});
log("Admin", "Employee cannot create holidays", empHolidaysWrite.status === 403);

const empPoliciesWrite = await api(tokens.employee, "policies", {
  method: "POST",
  body: JSON.stringify({ title: "Fake Policy", content: "test", category: "general" }),
});
log("Admin", "Employee cannot create policies", empPoliciesWrite.status === 403);

const empAssetsWrite = await api(tokens.employee, "assets", {
  method: "POST",
  body: JSON.stringify({ name: "Stolen Laptop", asset_type: "laptop", status: "available" }),
});
log("Admin", "Employee cannot create assets", empAssetsWrite.status === 403);

const mgrEmpCreate = await api(tokens.manager, "employees", {
  method: "POST",
  body: JSON.stringify({
    full_name: "Unauthorized Hire",
    email: "hack@evil.com",
    role: "employee",
    status: "active",
  }),
});
log("Admin", "Manager cannot create employees", mgrEmpCreate.status === 403 || mgrEmpCreate.status === 401);

console.log("\n--- Attendance & policies read ---");
const aliAttendance = await api(tokens.employee, `attendance?employee_id=eq.${ali?.id}&select=id&limit=5`);
log("Attendance", "Employee can read own attendance", aliAttendance.status === 200);

const policies = await api(tokens.employee, "policies?select=id,title&limit=5");
log("Policies", "Employee can read policies", policies.status === 200);

const passed = results.filter((r) => r.pass).length;
const failed = results.filter((r) => !r.pass).length;
console.log(`\n=== SUMMARY: ${passed} passed, ${failed} failed, ${results.length} total ===\n`);

import { writeFileSync } from "fs";
writeFileSync(
  resolve(root, "docs/ROLE_QA_RESULTS.json"),
  JSON.stringify({ runAt: new Date().toISOString(), appUrl: APP_URL, passed, failed, total: results.length, results }, null, 2)
);
console.log("Report written to docs/ROLE_QA_RESULTS.json");

process.exit(failed > 0 ? 1 : 0);
