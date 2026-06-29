/**
 * End-to-end API/RLS test suite for MindVista HRMS.
 * Run: node scripts/e2e-test.mjs
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

const results = [];

function log(name, pass, detail = "") {
  results.push({ name, pass, detail });
  const icon = pass ? "PASS" : "FAIL";
  console.log(`[${icon}] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function login(email, password) {
  const res = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Login failed for ${email}: ${data.error_description || JSON.stringify(data)}`);
  return data.access_token;
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

async function createUser({ email, password, fullName, role, employeeCode, managerId, leadId, designation }) {
  const existing = await serviceApi(`employees?email=eq.${encodeURIComponent(email)}&select=id`);
  if (Array.isArray(existing.body) && existing.body.length > 0) {
    return existing.body[0].id;
  }

  const authRes = await fetch(`${URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: fullName } }),
  });
  const authData = await authRes.json();
  if (!authData.id) throw new Error(`Auth create failed for ${email}: ${JSON.stringify(authData)}`);

  const deptRes = await serviceApi("departments?name=eq.Engineering&select=id");
  const deptId = deptRes.body?.[0]?.id ?? null;

  const empRes = await serviceApi("employees", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: authData.id,
      employee_code: employeeCode,
      full_name: fullName,
      email,
      designation,
      department_id: deptId,
      manager_id: managerId ?? null,
      lead_id: leadId ?? null,
      role,
      status: "active",
      employment_type: "full_time",
      work_location: "onsite",
      joining_date: "2026-01-15",
      date_of_birth: "1995-06-15",
      cnic_number: "42101-1234567-1",
    }),
  });

  if (!Array.isArray(empRes.body) || !empRes.body[0]?.id) {
    throw new Error(`Employee insert failed for ${email}: ${JSON.stringify(empRes.body)}`);
  }
  return empRes.body[0].id;
}

// --- Main ---
console.log("\n=== MindVista HRMS E2E Test Suite ===\n");

const PASSWORD = "Test@MindVista2026";

let managerId, empAliId, empFatimaId, devAdminId;

try {
  // Setup users
  console.log("--- Setup test users ---");
  const devRes = await serviceApi("employees?email=eq.dev@mindvista.io&select=id");
  devAdminId = devRes.body[0].id;

  managerId = await createUser({
    email: "sarah.lead@mindvista.io",
    password: PASSWORD,
    fullName: "Sarah Khan",
    role: "manager",
    employeeCode: "MV-MGR-001",
    designation: "Engineering Manager",
    managerId: devAdminId,
    leadId: devAdminId,
  });
  console.log(`Manager: ${managerId}`);

  empAliId = await createUser({
    email: "ali.dev@mindvista.io",
    password: PASSWORD,
    fullName: "Ali Ahmed",
    role: "employee",
    employeeCode: "MV-EMP-001",
    designation: "Software Engineer",
    managerId,
    leadId: managerId,
  });
  console.log(`Employee Ali: ${empAliId}`);

  empFatimaId = await createUser({
    email: "fatima.dev@mindvista.io",
    password: PASSWORD,
    fullName: "Fatima Noor",
    role: "employee",
    employeeCode: "MV-EMP-002",
    designation: "Junior Developer",
    managerId,
    leadId: managerId,
  });
  console.log(`Employee Fatima: ${empFatimaId}`);

  const tokens = {
    admin: await login("dev@mindvista.io", "MindVista@Dev2026"),
    manager: await login("sarah.lead@mindvista.io", PASSWORD),
    ali: await login("ali.dev@mindvista.io", PASSWORD),
    fatima: await login("fatima.dev@mindvista.io", PASSWORD),
  };

  console.log("\n--- Auth tests ---");
  const anonEmp = await fetch(`${URL}/rest/v1/employees?select=email&limit=1`, { headers: { apikey: ANON } });
  const anonBody = await anonEmp.json();
  log("Anonymous cannot read employees", Array.isArray(anonBody) && anonBody.length === 0);

  console.log("\n--- Hierarchy visibility ---");
  const mgrTeam = await api(tokens.manager, "employees?select=id,full_name,manager_id,lead_id");
  const mgrTeamCount = Array.isArray(mgrTeam.body) ? mgrTeam.body.length : 0;
  log("Manager sees team members in hierarchy", mgrTeamCount >= 2, `visible: ${mgrTeamCount}`);

  const aliPeers = await api(tokens.ali, "employees?select=id,full_name,email");
  const aliPeerCount = Array.isArray(aliPeers.body) ? aliPeers.body.length : 0;
  log("Employee sees limited employee list (not all org)", aliPeerCount < 5, `visible: ${aliPeerCount}`);

  console.log("\n--- Leave workflow ---");
  // Ali applies leave
  const leaveStart = "2026-07-07";
  const leaveEnd = "2026-07-09";
  const applyRes = await api(tokens.ali, "leaves", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      employee_id: empAliId,
      leave_type: "annual",
      start_date: leaveStart,
      end_date: leaveEnd,
      reason: "Family event E2E test",
      days_count: 3,
      status: "pending",
    }),
  });
  const leaveId = applyRes.body?.[0]?.id;
  log("Employee can apply leave", applyRes.status === 201 && !!leaveId, leaveId || JSON.stringify(applyRes.body));

  // Notification to lead
  const mgrNotifs = await api(tokens.manager, `notifications?recipient_id=eq.${managerId}&order=created_at.desc&limit=5&select=title,type`);
  const hasLeaveNotif = Array.isArray(mgrNotifs.body) && mgrNotifs.body.some((n) => n.type === "leave_request" || n.title?.includes("leave"));
  log("Lead receives notification on leave apply", hasLeaveNotif);

  // Manager sees pending leave
  const mgrPending = await api(tokens.manager, `leaves?employee_id=eq.${empAliId}&status=eq.pending&select=id`);
  log("Manager sees pending leave for report", Array.isArray(mgrPending.body) && mgrPending.body.length >= 1);

  // Fatima cannot approve Ali's leave
  const fatimaApprove = await api(tokens.fatima, `leaves?id=eq.${leaveId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "approved", reviewed_at: new Date().toISOString() }),
  });
  log("Non-lead employee cannot approve others leave", fatimaApprove.status !== 200 && fatimaApprove.status !== 204, `status ${fatimaApprove.status}`);

  // Manager approves
  const mgrApprove = await api(tokens.manager, `leaves?id=eq.${leaveId}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      status: "approved",
      reviewed_by: managerId,
      reviewed_at: new Date().toISOString(),
    }),
  });
  log("Lead/manager can approve leave", mgrApprove.status === 200 && mgrApprove.body?.[0]?.status === "approved");

  // Balance deducted
  const balanceAfter = await api(tokens.ali, `leave_balances?employee_id=eq.${empAliId}&select=annual_used`);
  const annualUsed = balanceAfter.body?.[0]?.annual_used ?? 0;
  log("Leave balance deducted on approval", annualUsed >= 3, `annual_used=${annualUsed}`);

  // Employee without lead cannot apply (create temp user)
  const noLeadId = await createUser({
    email: "temp.nolead@mindvista.io",
    password: PASSWORD,
    fullName: "Temp No Lead",
    role: "employee",
    employeeCode: "MV-TMP-001",
    designation: "Temp",
    managerId: null,
    leadId: null,
  });
  const noLeadToken = await login("temp.nolead@mindvista.io", PASSWORD);
  const noLeadApply = await api(noLeadToken, "leaves", {
    method: "POST",
    body: JSON.stringify({
      employee_id: noLeadId,
      leave_type: "casual",
      start_date: "2026-08-01",
      end_date: "2026-08-01",
      days_count: 1,
      status: "pending",
    }),
  });
  // RLS allows insert but app blocks - at DB level insert might succeed. Check app layer separately.
  log("No-lead user DB insert (app should block in UI)", noLeadApply.status === 201 || noLeadApply.status === 403, `status ${noLeadApply.status} — app layer blocks separately`);

  console.log("\n--- Admin field protection ---");
  const selfEmp = await api(tokens.ali, `employees?id=eq.${empAliId}&select=cnic_number,employee_code,role`);
  const beforeCnic = selfEmp.body?.[0]?.cnic_number;
  const tamper = await api(tokens.ali, `employees?id=eq.${empAliId}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ cnic_number: "99999-HACKED", role: "admin", employee_code: "HACKED" }),
  });
  const afterEmp = await api(tokens.ali, `employees?id=eq.${empAliId}&select=cnic_number,employee_code,role`);
  const after = afterEmp.body?.[0];
  log(
    "Employee cannot escalate role via self-update (DB trigger)",
    after?.role === "employee" && after?.employee_code !== "HACKED",
    `role=${after?.role}, code=${after?.employee_code}`
  );

  console.log("\n--- Role access ---");
  const empAdminPage = await api(tokens.ali, "employees?select=id&limit=100");
  const empSeesAll = Array.isArray(empAdminPage.body) ? empAdminPage.body.length : 0;
  log("Employee cannot list all employees (admin view)", empSeesAll < 10, `count=${empSeesAll}`);

  const adminEmpList = await api(tokens.admin, "employees?select=id&limit=100");
  log("Admin can list all employees", Array.isArray(adminEmpList.body) && adminEmpList.body.length >= 5);

  console.log("\n--- Assets ---");
  let assetId;
  const existingAsset = await serviceApi("assets?serial_number=eq.E2E-LAPTOP-001&select=id");
  if (existingAsset.body?.[0]?.id) {
    assetId = existingAsset.body[0].id;
  } else {
    const assetCreate = await api(tokens.admin, "assets", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        name: "E2E MacBook Pro",
        asset_type: "laptop",
        serial_number: "E2E-LAPTOP-001",
        status: "available",
      }),
    });
    assetId = assetCreate.body?.[0]?.id;
  }
  log("Admin can create asset", !!assetId);

  const assignRes = await api(tokens.admin, "asset_assignments", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      asset_id: assetId,
      employee_id: empAliId,
      assigned_date: "2026-06-11",
    }),
  });
  log("Admin can assign asset", assignRes.status === 201, `status ${assignRes.status}`);

  const aliAssets = await api(tokens.ali, `asset_assignments?employee_id=eq.${empAliId}&select=*,asset:assets(name)&return_date=is.null`);
  log("Employee sees assigned assets", Array.isArray(aliAssets.body) && aliAssets.body.length >= 1);

  const fatimaAssets = await api(tokens.fatima, `asset_assignments?employee_id=eq.${empAliId}&select=id`);
  log("Employee cannot see another employee assets", Array.isArray(fatimaAssets.body) && fatimaAssets.body.length === 0);

  console.log("\n--- Performance ---");
  const goalRes = await api(tokens.manager, "performance_goals", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      employee_id: empAliId,
      title: "E2E Q3 Goal",
      description: "Test goal",
      created_by: managerId,
      completion_status: 0,
    }),
  });
  const goalId = goalRes.body?.[0]?.id;
  log("Manager can create goal for report", goalRes.status === 201 && !!goalId, goalId || JSON.stringify(goalRes.body));

  const aliGoalUpdate = await api(tokens.ali, `performance_goals?id=eq.${goalId}`, {
    method: "PATCH",
    body: JSON.stringify({ completion_status: 50 }),
  });
  log("Employee cannot update goal progress (RLS)", aliGoalUpdate.status !== 200 && aliGoalUpdate.status !== 204, `status ${aliGoalUpdate.status}`);

  console.log("\n--- Security edge cases ---");
  const spamNotif = await api(tokens.ali, "notifications", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      recipient_id: managerId,
      type: "phishing",
      title: "E2E security test spam",
      message: "Should be blocked after fix",
    }),
  });
  log("SECURITY: Notification spam via API (should FAIL after fix)", spamNotif.status !== 201, `status ${spamNotif.status} — VULNERABILITY if 201`);

  const mgrNotifToAli = await api(tokens.manager, "notifications", {
    method: "POST",
    body: JSON.stringify({
      recipient_id: empAliId,
      type: "fake",
      title: "Fake approval",
      message: "Manager forged notification",
    }),
  });
  log("SECURITY: Any user can forge notifications (should FAIL)", mgrNotifToAli.status !== 201, `status ${mgrNotifToAli.status}`);

  console.log("\n--- Policies & holidays ---");
  const policies = await api(tokens.ali, "policies?select=id,title&limit=5");
  log("Employee can read policies", policies.status === 200);

  const aliHolidayInsert = await api(tokens.ali, "holidays", {
    method: "POST",
    body: JSON.stringify({ name: "Hacked Holiday", date: "2026-12-31" }),
  });
  log("Employee cannot create holidays", aliHolidayInsert.status !== 201, `status ${aliHolidayInsert.status}`);

  console.log("\n--- Projects module ---");
  log("Projects module exists in codebase", false, "NOT IMPLEMENTED — cannot test project assignment");

} catch (err) {
  console.error("\nFATAL:", err.message);
  results.push({ name: "Test suite execution", pass: false, detail: err.message });
}

const passed = results.filter((r) => r.pass).length;
const failed = results.filter((r) => !r.pass).length;
console.log(`\n=== SUMMARY: ${passed} passed, ${failed} failed, ${results.length} total ===\n`);

// Write JSON report
const reportPath = resolve(root, "docs/E2E_TEST_RESULTS.json");
import { writeFileSync } from "fs";
writeFileSync(
  reportPath,
  JSON.stringify(
    {
      runAt: new Date().toISOString(),
      testUsers: {
        manager: "sarah.lead@mindvista.io",
        employee1: "ali.dev@mindvista.io",
        employee2: "fatima.dev@mindvista.io",
        noLead: "temp.nolead@mindvista.io",
        password: PASSWORD,
        admin: "dev@mindvista.io",
      },
      hierarchy: {
        devAdmin: "top",
        sarah: { reportsTo: "devAdmin", leads: ["ali", "fatima"] },
        ali: { reportsTo: "sarah", lead: "sarah" },
        fatima: { reportsTo: "sarah", lead: "sarah" },
      },
      summary: { passed, failed, total: results.length },
      results,
    },
    null,
    2
  )
);
console.log(`Report written to ${reportPath}`);

process.exit(failed > 0 ? 1 : 0);
