# MindVista HRMS — Implementation Audit & Developer Action Items

**Audit date:** June 11, 2026  
**Audited by:** Internal code + live API security review  
**Deployment reviewed:** [Vercel preview — feature-crm-enhancements](https://mindvista-crm-enhanced-git-feature-crm-enhancements-mind-vista.vercel.app/projects)  
**Local codebase:** `mindvista-crm` → `main` @ `078fd05`  
**Test credentials used:** `dev@mindvista.io` (super admin)

---

## Executive summary

| Area | Status |
|------|--------|
| Auth & route protection | **Good** — unauthenticated users redirected to `/login`; API blocks anonymous reads |
| Role-based admin pages | **Good** — all `/admin/*` pages use `requireRole()` |
| Database RLS | **Mostly good** — 2 critical policy gaps found (see Security) |
| Leave workflow (lead approval) | **Implemented** — requires `lead_id` on employees; only 2 admin accounts exist today |
| Projects module | **Not in local `main`** — deployment may be a different branch/repo |
| Production readiness | **Not ready** — security fixes, test data, and module alignment needed |

**Bottom line:** Core HRMS modules work for admin flows, but the Vercel URL you shared likely does **not** match the local `main` branch. The **Projects** module is missing from `main`. Security has **2 high-priority** RLS/action gaps that must be fixed before wider rollout.

---

## 1. Deployment vs local codebase (critical)

| Item | Detail |
|------|--------|
| Vercel hostname | `mindvista-crm-enhanced-git-feature-crm-enhancements-mind-vista` |
| Implied source | Repo `mindvista-crm-enhanced`, branch `feature-crm-enhancements` |
| Local repo | `mindvista-crm`, branch `main` only |
| `/projects` on deployment | Returns **307 → /login** when unauthenticated (same as all protected routes). **Cannot confirm** Projects UI exists without signing in on that deployment. |
| `/projects` in local code | **Does not exist** — no route, types, migration, actions, or sidebar entry |

### Action items (developer)

- [ ] **P0** — Confirm which Git repo/branch is deployed to the Vercel preview and align local work with it.
- [ ] **P0** — Sign in on the Vercel preview with `dev@mindvista.io` and verify whether `/projects` renders or 404s.
- [ ] **P1** — If Projects lives only on `feature-crm-enhancements`, merge or re-implement on `main` with schema, RLS, and tests.
- [ ] **P1** — Document canonical deployment URL and branch for QA (preview vs production).

---

## 2. Module-by-module status

Legend: ✅ Working | ⚠️ Partial / gaps | ❌ Missing | 🔒 Security note

### 2.1 Authentication & session

| Check | Result |
|-------|--------|
| Login page | ✅ `/login` |
| Middleware session gate | ✅ Redirects unauthenticated users |
| Employee profile required | ✅ `requireAuth()` redirects if no `employees` row |
| Dev admin login (live) | ✅ `dev@mindvista.io` authenticates successfully |
| Unauthenticated REST API | ✅ `GET /employees` returns `[]` (RLS blocks) |

| Gap | Detail |
|-----|--------|
| Middleware uses `getSession()` | Cookie JWT is not server-validated on every request. Prefer `getUser()` for stricter session validation or accept risk for performance. |
| No `/signup` | By design — admins create users |

---

### 2.2 Dashboard (`/dashboard`)

| Feature | Status |
|---------|--------|
| Leave balance cards | ✅ |
| Recent leave requests | ✅ |
| Assigned assets summary | ✅ |
| Team hierarchy tree | ✅ (shows only if user has reports/leads) |
| Pending leave approvals (lead) | ✅ |
| Daily check-in removed | ✅ (Hubstaff) |

**Gaps:** Team hierarchy empty until employees have `manager_id` / `lead_id` set.

---

### 2.3 Profile (`/profile`)

| Feature | Status |
|---------|--------|
| View profile | ✅ |
| Edit contact info (phone, address, emergency) | ✅ |
| Admin-only fields read-only in UI | ✅ (employee ID, DOB, CNIC, joining date) |
| Profile photo upload | ✅ (`profile-photos` bucket exists in Supabase) |
| DB trigger blocks self-edit of admin fields | ✅ `protect_employee_admin_fields` |

**Gaps:**
- `admin@mindvista.io` has `employee_code: null` — backfill admin records.
- No employee document upload UI (schema exists, no frontend).

---

### 2.4 Employees — Admin (`/admin/employees`)

| Feature | Status |
|---------|--------|
| Create employee (auth + DB row) | ✅ Admin only |
| Edit employee | ✅ `EditEmployeeDialog` |
| Fields: employee_code, DOB, CNIC, joining, reporting_to, lead | ✅ |
| Page access | ✅ `requireRole("admin")` |

**Gaps:**
- [ ] **P1** — Add validation: email format, password strength, enum values, unique `employee_code`.
- [ ] **P1** — Roll back auth user if `employees` insert fails (orphan user risk).
- [ ] **P2** — Only 2 users in DB today; create test **employee** and **manager** accounts for realistic QA.

---

### 2.5 Leave (`/leave`, `/admin/leaves`)

| Feature | Status |
|---------|--------|
| Apply leave | ✅ |
| Requires `lead_id` on applicant | ✅ Enforced in `applyLeave` |
| Lead notification on apply | ✅ DB trigger + `notifications` table |
| Lead/manager approval in app | ✅ `reviewLeave` checks admin / lead / manager |
| Pending approvals on Leave page | ✅ |
| Pending on dashboard | ✅ |
| Admin leave page | ✅ Admins see all; managers see team pending only |

**Gaps:**
- [ ] **P1** — No leave balance check before apply (can exceed quota).
- [ ] **P1** — No overlapping leave / duplicate pending guard.
- [ ] **P1** — No `leave_type` enum validation in action layer.
- [ ] **P2** — Rejection reason optional in UI; consider requiring for reject.
- [ ] **P0 for QA** — Set `lead_id` and `manager_id` on test employees or leave apply will fail.

**Live DB:** Migration `004` applied (`employee_code`, `lead_id`, `notifications` exist).

---

### 2.6 Assets (`/assets`, `/admin/assets`)

| Feature | Status |
|---------|--------|
| Admin CRUD assets | ✅ |
| Assign / return assets | ✅ |
| Employee view assigned items | ✅ |
| Dashboard asset summary | ✅ |

**Gaps:**
- [ ] **P2** — `returnAsset(assignmentId, assetId)` does not verify IDs belong together (IDOR-style data integrity bug).
- [ ] **P2** — No guard against assigning non-`available` assets or double assignment.

---

### 2.7 Policies (`/policies`, `/admin/policies`)

| Feature | Status |
|---------|--------|
| Employee read policies | ✅ |
| Admin create/delete | ✅ |
| File upload to storage | ⚠️ `createPolicy` accepts arbitrary `file_url` string — no upload flow |

**Gaps:**
- [ ] **P2** — Implement policy file upload to `company-policies` bucket instead of free-text URL.

---

### 2.8 Performance (`/performance`, `/admin/performance`)

| Feature | Status |
|---------|--------|
| View goals & reviews | ✅ |
| Manager/admin create goals | ✅ |
| Manager/admin submit reviews | ✅ |
| Employee update own goal progress | ❌ Not in UI; RLS blocks employee updates |

**Gaps:**
- [ ] **P0 SECURITY** — `updateGoalProgress()` has **no auth check** in `src/actions/performance.ts`. Any authenticated user could call it; RLS partially mitigates but must add `getCurrentEmployee()` + role/ownership checks.
- [ ] **P2** — Allow employees to update progress on their own goals (product + RLS).
- [ ] **P2** — Validate review rating range (e.g. 1–5).

---

### 2.9 Holidays (`/admin/holidays`)

| Feature | Status |
|---------|--------|
| Admin CRUD | ✅ |
| Used in leave day calculation | ✅ |

---

### 2.10 Attendance

| Feature | Status |
|---------|--------|
| Employee check-in UI | ❌ Removed (Hubstaff info page at `/attendance`) |
| Admin attendance report | ⚠️ Page exists at `/admin/attendance` but **removed from sidebar** |
| Server actions (`checkIn`, etc.) | ⚠️ Still in codebase |

**Gaps:**
- [ ] **P2** — Remove or hide `/admin/attendance` and dead attendance actions if Hubstaff is permanent.
- [ ] **P2** — Lead visibility on attendance RLS uses `is_manager_of` only — inconsistent with leave (lead not included).

---

### 2.11 Notifications

| Feature | Status |
|---------|--------|
| Bell in header | ✅ |
| Mark read / mark all read | ✅ |
| Leave request → lead notification | ✅ |

---

### 2.12 Projects (`/projects`)

| Feature | Status |
|---------|--------|
| Local `main` codebase | ❌ **Not implemented** |
| Vercel preview | ⚠️ **Unknown** — auth redirect only; verify after login on deployment |

**Expected scope (if on feature branch):** Define with product owner — projects, tasks, assignments, client linkage, etc.

---

### 2.13 Not implemented (schema exists, no UI)

| Table / feature | Status |
|-----------------|--------|
| `employee_documents` | ❌ No UI or actions |
| `audit_logs` | ❌ No UI; INSERT policy open (see Security) |
| `timesheets` | ⚠️ Actions exist; attendance module deprecated |

---

## 3. Security audit

### 3.1 What passed (live tests)

| Test | Result |
|------|--------|
| `dev@mindvista.io` login | ✅ Pass |
| Anonymous `GET /employees` | ✅ Blocked (empty result) |
| Admin can list employees | ✅ Pass (2 records) |
| Migration 004 tables/columns | ✅ Present |
| Storage buckets | ✅ `employee-documents`, `company-policies`, `assets-media`, `profile-photos` |

### 3.2 High severity — fix before production

#### H1. Open notification INSERT policy

**Location:** `supabase/migrations/004_hierarchy_notifications.sql`

```sql
CREATE POLICY "notifications_insert_system" ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);
```

**Live test:** Authenticated user can `POST /notifications` for any `recipient_id`.  
**Risk:** Notification spam, phishing-style in-app messages, harassment.  
**Fix:**

- [ ] **P0** — Restrict INSERT to `SECURITY DEFINER` triggers/functions only, or `WITH CHECK (false)` for `authenticated` and use service role for server-side inserts.
- [ ] **P0** — Remove test notification created during audit if still present.

#### H2. `updateGoalProgress` without authentication

**Location:** `src/actions/performance.ts:29`

```ts
export async function updateGoalProgress(goalId: string, completionStatus: number) {
  const supabase = await createClient();
  // No getCurrentEmployee() or requireRole()
```

**Fix:**

- [ ] **P0** — Add `getCurrentEmployee()` + authorize admin/manager/goal owner before update.

#### H3. Open audit log INSERT policy

**Location:** `001_initial_schema.sql`

```sql
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);
```

**Risk:** Log pollution / fake audit entries.  
**Fix:**

- [ ] **P1** — Restrict to service role or `is_admin()` only; implement server-side audit writer.

### 3.3 Medium severity

| ID | Issue | Fix priority |
|----|-------|--------------|
| M1 | Middleware `getSession()` vs validated `getUser()` | P2 |
| M2 | No input validation (Zod) on FormData actions | P1 |
| M3 | `returnAsset` ID pair not validated | P2 |
| M4 | `createEmployee` orphan auth user on DB failure | P1 |
| M5 | `profile-photos` bucket is **public** — URLs guessable if path known | P2 — consider private bucket + signed URLs |
| M6 | No rate limiting on login / server actions | P2 |
| M7 | Service role key in `.env.local` — never expose client-side | Ongoing |

### 3.4 Low severity

| ID | Issue |
|----|-------|
| L1 | MIME type for profile photo spoofable (`image/*` only) |
| L2 | Managers can reach `/admin/attendance` by URL though nav removed |
| L3 | No CSRF tokens — mitigated by SameSite cookies + Server Actions |

### 3.5 Defense layers (working well)

- Portal layout: `requireAuth()` on all `(portal)` routes
- Admin pages: `requireRole("admin")` or `("admin","manager")` as appropriate
- RLS on employees, leaves, leave_balances, assets (admin writes)
- DB trigger `protect_employee_admin_fields` prevents privilege escalation via profile update
- `reviewLeave` authorization aligned with RLS (admin / lead / manager)
- `markNotificationRead` scoped to `recipient_id`

---

## 4. Database & environment checklist

### Applied migrations (verified live)

| Migration | Status |
|-----------|--------|
| `001_initial_schema.sql` | ✅ |
| `002_seed_data.sql` | ✅ (departments, holidays) |
| `003_storage_policies.sql` | ✅ |
| `004_hierarchy_notifications.sql` | ✅ |

### Current data state (June 2026)

| Entity | Count | Notes |
|--------|-------|-------|
| Employees | 2 | Both `admin` role only |
| `admin@mindvista.io` | — | Missing `employee_code`, `lead_id` |
| `dev@mindvista.io` | — | `MV-DEV-001`, no lead/manager |
| Leave balances | 2 | Auto-created on employee insert |

### Action items

- [ ] **P0** — Create QA users: 1× employee, 1× manager, 1× lead (can be same person as manager).
- [ ] **P1** — Backfill `employee_code`, `date_of_birth`, `cnic_number` for existing admins.
- [ ] **P1** — Set `lead_id` / `manager_id` on QA users to test hierarchy + leave approval end-to-end.
- [ ] **P2** — Confirm Vercel env vars match Supabase project (`NEXT_PUBLIC_SUPABASE_URL`, keys).

---

## 5. QA test plan (for developer)

Use **two browsers** (admin + employee) after creating test users.

### Auth & access

- [ ] Logout redirects to `/login`
- [ ] Direct `/admin/employees` as employee → redirect to `/dashboard`
- [ ] Direct `/admin/assets` as manager → redirect to `/dashboard`

### Employee admin

- [ ] Create employee with employee ID, DOB, CNIC, lead, reporting manager
- [ ] Edit employee — verify fields persist
- [ ] Log in as that employee — verify admin fields read-only on profile

### Leave flow

- [ ] Employee without `lead_id` cannot apply (error message)
- [ ] Employee applies leave → lead receives notification bell item
- [ ] Lead approves from `/leave` → employee balance decrements
- [ ] Lead rejects → employee notified
- [ ] Non-lead employee cannot approve another's leave (API returns error)

### Assets

- [ ] Admin creates asset, assigns to employee
- [ ] Employee sees asset on `/assets` and dashboard
- [ ] Admin returns asset → status `available`

### Profile photo

- [ ] Upload JPG/PNG under 5MB
- [ ] Reject file over 5MB
- [ ] Photo appears in header avatar after refresh

### Security regression (after fixes)

- [ ] Attempt `POST /notifications` as employee to another user's ID → **must fail**
- [ ] Call `updateGoalProgress` without auth → **must fail**
- [ ] Anonymous REST reads on `employees`, `leaves`, `assets` → **empty or 401**

### Projects (if on feature branch)

- [ ] `/projects` loads after login
- [ ] CRUD + assignment + RLS per role
- [ ] Document API and add to sidebar

---

## 6. Prioritized backlog for developer

### P0 — Blockers (security & alignment)

1. Fix notifications INSERT RLS policy
2. Add auth to `updateGoalProgress`
3. Confirm deployment repo/branch vs local `main`; locate Projects module
4. Sign in on Vercel preview and document `/projects` status
5. Create test employee + manager users with hierarchy fields set

### P1 — Important (functionality & data integrity)

6. Leave balance + overlap validation on apply
7. Input validation layer (Zod) for all server actions
8. `createEmployee` rollback on failure
9. Backfill admin employee records (`employee_code`, etc.)
10. Merge `feature-crm-enhancements` into `main` or document divergence

### P2 — Polish

11. Remove dead attendance code / admin attendance page
12. Align attendance RLS with lead hierarchy
13. Fix `returnAsset` ID validation
14. Policy file upload to storage
15. Employee goal progress self-service
16. Private profile photos or signed URLs
17. `scripts/create-admin.mjs` — fix Node 20 WebSocket issue (`ws` package)
18. Add `Untitled` to `.gitignore` if it contains secrets

---

## 7. Reference

| Resource | Location |
|----------|----------|
| GitHub (local audited) | `https://github.com/abdullahshafiq28/mindvista-crm` |
| Vercel preview | `https://mindvista-crm-enhanced-git-feature-crm-enhancements-mind-vista.vercel.app` |
| Dev admin | `dev@mindvista.io` |
| Migrations | `supabase/migrations/` |
| Auth helpers | `src/lib/auth.ts` |
| Middleware | `src/lib/supabase/middleware.ts` |
| Create admin script | `scripts/create-admin.mjs` |

---

## 8. Sign-off template

| Role | Name | Date | Notes |
|------|------|------|-------|
| Developer | | | P0 items completed |
| QA | | | Test plan §5 passed |
| Owner | | | Projects scope approved |

---

*This document reflects the state of `mindvista-crm` `main` and live Supabase API tests as of the audit date. Re-run security tests after RLS/policy changes.*
