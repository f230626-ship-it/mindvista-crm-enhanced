# MindVista HRMS — Final E2E Test Report

**Date:** June 11, 2026  
**Environment:** Supabase (live) + `mindvista-crm` `main` codebase  
**Test method:** Automated API/RLS suite + manual edge-case verification  
**Raw results:** `docs/E2E_TEST_RESULTS.json`  
**Script:** `node scripts/e2e-test.mjs` (re-runnable)

---

## 1. Executive summary

| Metric | Result |
|--------|--------|
| Test users created | **5** (1 manager, 2 employees, 1 no-lead employee, existing admins) |
| Hierarchy configured | **Yes** — manager → 2 reports, shared team lead |
| Modules tested | Auth, hierarchy, leave, assets, performance, policies, holidays, security |
| **Projects module** | **Not implemented** — cannot assign or test projects |
| Automated tests | **20 pass / 4 fail** (2 false negatives corrected below → **22 pass / 2 real failures**) |
| Production ready? | **No** — fix notification forgery, leave balance validation, implement projects |

### Verdict

Core HR workflows **work end-to-end** with a realistic org hierarchy: employees apply leave, leads get notified, leads approve/reject, balances update, assets assign correctly, and admin-only fields are protected. **Projects cannot be tested** because the module does not exist on `main`. Two **real gaps** remain: authenticated users with certain paths can **forge notifications**, and **leave can exceed quota** at the database layer.

---

## 2. Test org structure

No new role enum was added. The system already defines `admin | manager | employee`. We created a **mini org** using existing roles:

```
Developer Admin (dev@mindvista.io)          role: admin
    └── Sarah Khan (sarah.lead@mindvista.io)   role: manager  [MV-MGR-001]
            ├── Ali Ahmed (ali.dev@mindvista.io)    role: employee  [MV-EMP-001]
            └── Fatima Noor (fatima.dev@mindvista.io) role: employee  [MV-EMP-002]

Temp No Lead (temp.nolead@mindvista.io)     role: employee  [MV-TMP-001]  — no manager/lead
```

| User | Email | Password | Role | Reports to | Lead |
|------|-------|----------|------|------------|------|
| Developer Admin | `dev@mindvista.io` | `MindVista@Dev2026` | admin | — | — |
| Sarah Khan | `sarah.lead@mindvista.io` | `Test@MindVista2026` | manager | Dev Admin | Dev Admin |
| Ali Ahmed | `ali.dev@mindvista.io` | `Test@MindVista2026` | employee | Sarah | Sarah |
| Fatima Noor | `fatima.dev@mindvista.io` | `Test@MindVista2026` | employee | Sarah | Sarah |
| Temp No Lead | `temp.nolead@mindvista.io` | `Test@MindVista2026` | employee | — | — |

**Sarah is both reporting manager and team lead** for Ali and Fatima (supported design — same person in both fields).

---

## 3. Module test results

### 3.1 Authentication & access control

| Test | Result | Notes |
|------|--------|-------|
| Anonymous API read on `employees` | ✅ PASS | Returns empty — RLS blocks |
| All portal routes require login | ✅ PASS | Middleware redirects to `/login` |
| Manager cannot INSERT `employees` | ✅ PASS | HTTP 403 RLS violation |
| Employee sees only self in employee list | ✅ PASS | Ali sees 1 record |
| Manager sees hierarchy (3 people) | ✅ PASS | Self + Ali + Fatima |
| Admin sees all employees (5+) | ✅ PASS | Full org visibility |

---

### 3.2 Hierarchy & dashboard

| Test | Result | Notes |
|------|--------|-------|
| `manager_id` set on reports | ✅ PASS | |
| `lead_id` set on reports | ✅ PASS | Same as manager (Sarah) |
| Manager sees direct reports via RLS | ✅ PASS | 3 employees visible |
| Employee cannot see full org directory | ✅ PASS | |

**UI note:** Dashboard hierarchy tree will populate for Sarah when logged in via the app. API confirms data model is correct.

---

### 3.3 Leave management (full workflow tested)

| Test | Result | Notes |
|------|--------|-------|
| Ali applies annual leave (3 days) | ✅ PASS | Leave ID created |
| Sarah receives `leave_request` notification | ✅ PASS | DB trigger fired |
| Sarah sees pending leave for Ali | ✅ PASS | |
| Sarah approves leave | ✅ PASS | Status → `approved` |
| `annual_used` incremented by 3 | ✅ PASS | Balance trigger works |
| Sarah rejects Fatima's casual leave | ✅ PASS | Status → `rejected`, reason saved |
| Peer (Ali) cannot approve Fatima's leave | ✅ PASS | PATCH returns empty — status stays `pending` |
| Employee without lead — app blocks apply | ⚠️ PARTIAL | DB allows INSERT; `applyLeave()` action blocks in UI |
| Apply 30-day leave over quota | ❌ FAIL | **30-day annual leave created with no balance check** |

**Corrected false negative:** Initial automated test reported peer approval as failed because PostgREST returned HTTP 204. Follow-up verification showed **leave status unchanged** — RLS correctly blocked the update.

---

### 3.4 Employee profile & admin-only fields

| Test | Result | Notes |
|------|--------|-------|
| Employee self-update `role` → admin | ✅ BLOCKED | DB trigger `protect_employee_admin_fields` |
| Employee self-update `employee_code` | ✅ BLOCKED | Stays `MV-EMP-001` |
| Employee self-update `cnic_number` | ✅ BLOCKED | Trigger preserves original |
| Admin fields on create (code, DOB, CNIC) | ✅ PASS | Set via service role on user creation |

---

### 3.5 Assets

| Test | Result | Notes |
|------|--------|-------|
| Admin creates asset (E2E MacBook Pro) | ✅ PASS | Serial: `E2E-LAPTOP-001` |
| Admin assigns asset to Ali | ✅ PASS | |
| Ali sees own assigned asset | ✅ PASS | |
| Fatima cannot see Ali's assignments | ✅ PASS | Empty result |

---

### 3.6 Performance

| Test | Result | Notes |
|------|--------|-------|
| Manager creates goal for Ali | ✅ PASS | "E2E Q3 Goal" |
| Ali cannot update goal via API (RLS) | ✅ PASS | PATCH returns `[]` — no rows updated |
| `updateGoalProgress()` server action has no auth | ❌ CODE GAP | Not invoked in test; still unprotected in `src/actions/performance.ts` |

**Corrected false negative:** HTTP 204 on goal PATCH did not mean success — `completion_status` unchanged.

---

### 3.7 Policies & holidays

| Test | Result | Notes |
|------|--------|-------|
| Employee reads policies | ✅ PASS | |
| Employee cannot create holiday | ✅ PASS | HTTP 403 |

---

### 3.8 Notifications

| Test | Result | Notes |
|------|--------|-------|
| Auto notification on leave apply | ✅ PASS | Lead receives in-app notification |
| Employee → forge notification to manager | ✅ BLOCKED | HTTP 403 in this run |
| Manager → forge notification to employee | ❌ FAIL | **HTTP 201 — notification created** |

**Security risk:** Managers (and possibly other roles) can still insert fake notifications for other users via direct API. Tighten `notifications_insert_system` RLS policy.

---

### 3.9 Projects

| Test | Result | Notes |
|------|--------|-------|
| `/projects` route in codebase | ❌ NOT FOUND | |
| Project assignment | ❌ NOT TESTABLE | Module not built on `main` |
| Project schema / migrations | ❌ NOT FOUND | |

**Action required:** Implement projects module (schema, RLS, UI, assignment workflow) or merge from `feature-crm-enhancements` branch if it exists on Vercel deployment.

---

### 3.10 Attendance

| Test | Result | Notes |
|------|--------|-------|
| Check-in UI | N/A | Replaced with Hubstaff info page |
| Server actions still exist | ⚠️ | Dead code — remove if Hubstaff is permanent |

---

## 4. Security summary

| Severity | Finding | Status |
|----------|---------|--------|
| **High** | Managers can forge notifications via REST API | ❌ Open |
| **High** | `updateGoalProgress()` missing auth in server action | ❌ Open (RLS mitigates direct API for employees) |
| **Medium** | Leave can exceed quota (no validation) | ❌ Open |
| **Medium** | No-lead employees can INSERT leave at DB (app blocks only) | ⚠️ Partial |
| **Low** | Over-quota / overlapping leave not validated | ❌ Open |
| **Pass** | Anonymous data access blocked | ✅ |
| **Pass** | Employee privilege escalation blocked (DB trigger) | ✅ |
| **Pass** | Peer leave approval blocked (RLS) | ✅ |
| **Pass** | Cross-employee asset visibility blocked | ✅ |
| **Pass** | Manager cannot create employees at DB | ✅ |
| **Pass** | Holiday/policy write restricted | ✅ |

---

## 5. Edge cases tested

| Scenario | Expected | Actual |
|----------|----------|--------|
| Same person as manager + lead | Works | ✅ Sarah leads and manages Ali/Fatima |
| Lead approves leave | Approved + balance update | ✅ |
| Lead rejects leave | Rejected + reason stored | ✅ |
| Non-lead peer approves leave | Denied | ✅ RLS blocks (status unchanged) |
| Employee escalates to admin via PATCH | Denied | ✅ Trigger blocks |
| Employee lists all staff | Limited view | ✅ Sees self only |
| Manager lists team | Hierarchy members | ✅ Sees 3 |
| Apply leave without lead (DB) | Blocked ideally | ⚠️ DB allows; app action blocks |
| Apply 30 days annual (quota 20) | Blocked | ❌ Created at DB |
| Assign asset to employee A, B tries to view | Denied | ✅ |
| Manager creates performance goal for report | Allowed | ✅ |
| Employee updates own goal progress | Product TBD | RLS blocks; no UI anyway |

---

## 6. What works well (sign-off candidates)

1. **Hierarchy model** — `manager_id` + `lead_id` with same-person support  
2. **Leave approval chain** — apply → notify lead → approve/reject → balance deduction  
3. **Admin-only field protection** — DB trigger is effective  
4. **Asset assignment isolation** — employees only see own equipment  
5. **Role separation at DB** — manager cannot create employees; employee cannot admin  
6. **Auth gate** — unauthenticated access properly blocked  

---

## 7. Open action items for developer

### P0 — Must fix

| # | Item | Owner |
|---|------|-------|
| 1 | **Implement Projects module** (or merge feature branch): schema, RLS, CRUD, team assignment | Dev |
| 2 | **Fix notification INSERT RLS** — only system/triggers or admin service role | Dev |
| 3 | **Add auth to `updateGoalProgress()`** in `src/actions/performance.ts` | Dev |
| 4 | **Leave balance validation** on apply (app + optional DB constraint) | Dev |

### P1 — Should fix

| # | Item |
|---|------|
| 5 | Block leave INSERT at DB when `lead_id` IS NULL |
| 6 | Overlapping leave / duplicate pending request guard |
| 7 | `returnAsset()` validate assignmentId ↔ assetId |
| 8 | Remove dead attendance code if Hubstaff is final |
| 9 | Backfill `employee_code` on `admin@mindvista.io` |
| 10 | Add Zod validation on all server actions |

### P2 — QA / polish

| # | Item |
|---|------|
| 11 | UI test pass with Sarah / Ali / Fatima logins (browser) |
| 12 | Profile photo upload test per user |
| 13 | Performance review flow UI test |
| 14 | Align Vercel `feature-crm-enhancements` deployment with `main` |

---

## 8. How to re-run tests

```bash
# From project root (requires .env.local with Supabase keys)
node scripts/e2e-test.mjs
```

Results written to `docs/E2E_TEST_RESULTS.json`.

**Manual UI checklist** (use test users in §2):

- [ ] Login as Sarah → Dashboard shows team hierarchy + pending approvals  
- [ ] Login as Ali → Apply leave → Sarah gets bell notification  
- [ ] Login as Sarah → Approve from `/leave`  
- [ ] Login as Ali → See assigned MacBook on `/assets`  
- [ ] Login as Fatima → Cannot access `/admin/employees`  
- [ ] Login as Dev Admin → Full employee CRUD  

---

## 9. Test data created (cleanup optional)

| Entity | Identifier |
|--------|------------|
| Asset | E2E MacBook Pro / `E2E-LAPTOP-001` |
| Performance goal | E2E Q3 Goal (Ali) |
| Approved leave | Ali, 2026-07-07 → 2026-07-09 (3 days annual) |
| Rejected leave | Fatima, 2026-08-04 (1 day casual) |
| Pending over-quota leave | Ali, 2026-09-01 → 2026-09-30 (30 days) — **should be deleted or rejected** |
| Test notifications | Audit/spam entries — clean up in `notifications` table |

---

## 10. Final scorecard

| Area | Score | Comment |
|------|-------|---------|
| Auth & RLS | **8/10** | Solid; notification policy weak |
| Hierarchy | **9/10** | Works as designed |
| Leave workflow | **7/10** | Core flow good; quota validation missing |
| Assets | **9/10** | Works |
| Performance | **6/10** | Goals work; action auth gap |
| Projects | **0/10** | Not implemented |
| Overall HRMS (excl. projects) | **7.5/10** | Usable for internal pilot with fixes |

---

*Report generated after live E2E testing. Share this document + `docs/DEVELOPER_AUDIT.md` with your developer for the full picture.*
