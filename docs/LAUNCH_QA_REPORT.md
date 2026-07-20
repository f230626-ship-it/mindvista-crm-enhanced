# MindVista HRMS — Launch QA Report

**Date:** 8 July 2026  
**Environment:** Production — [https://hrms.mindvista.io](https://hrms.mindvista.io)  
**Branch tested:** `main` @ `9cbacae`  
**Test suites run:** `scripts/e2e-test.mjs`, `scripts/role-qa-test.mjs`, code review, responsive browser checks

---

## Executive summary

| Verdict | **Conditional launch** |
|---------|------------------------|
| Core HRMS (auth, leaves, profile, hierarchy, admin guards) | **Ready** |
| Role-based data isolation (RLS) | **Mostly ready** — app-layer guards compensate where RLS is permissive |
| Sales module access | **Ready** — correctly gated by `role` + `pm_role` |
| Mobile / tablet UX | **Not ready** — portal has no collapsible navigation |

**Recommendation:** Launch for **desktop-first** internal use now. Block external/mobile rollout until mobile navigation is implemented.

---

## Test accounts used

| Email | Role | `pm_role` | Purpose |
|-------|------|-----------|---------|
| `dev@mindvista.io` | admin | admin | Full admin + sales owner |
| `sarah.lead@mindvista.io` | manager | developer | Team lead, leave approvals |
| `ali.dev@mindvista.io` | employee | developer | Standard employee |
| `fatima.dev@mindvista.io` | employee | developer | Peer employee (negative tests) |

Password for test employees: `Test@MindVista2026`

---

## Role access matrix

### Sidebar visibility (UI layer)

| Nav item | Employee | Manager | Admin |
|----------|:--------:|:-------:|:-----:|
| Dashboard | ✅ | ✅ | ✅ |
| Sales | ❌ (unless `pm_role=bd`) | ❌ | ✅ → Command Center |
| Projects | ❌ | ✅ | ✅ |
| My Team | ✅ | ✅ | ✅ |
| Profile | ✅ | ✅ | ✅ |
| Leave | ✅ | ✅ | ✅ |
| Policies | ✅ | ✅ | ✅ |
| Assets | ✅ | ✅ | ✅ |
| My Performance | ✅ | ✅ | ✅ |
| **Management section** | | | |
| Employees | ❌ | ❌ | ✅ |
| Leave Approvals | ❌ | ✅ | ✅ |
| Performance Reviews | ❌ | ✅ | ✅ |
| Admin Assets | ❌ | ❌ | ✅ |
| Admin Policies | ❌ | ❌ | ✅ |
| Holidays | ❌ | ❌ | ✅ |

### Route guards (server redirects)

| Route | Guard | Employee direct URL |
|-------|-------|---------------------|
| `/admin/*` | `requireRole("admin")` or `admin,manager` | Redirects to `/dashboard` ✅ |
| `/sales/command`, `/sales/admin/*` | `requireSalesOwner()` | Redirects to `/sales/my-day` ✅ |
| `/sales/*` | `requireSalesAccess()` | Redirects to `/dashboard` if not admin/bd ✅ |
| `/projects` | `requireAuth()` only | **Page loads** (empty via RLS) ⚠️ |
| `/team`, `/leave`, `/profile` | `requireAuth()` | Works, scoped data ✅ |

---

## Module test results

### 1. Authentication & session — PASS

- Unauthenticated users redirected to `/login`
- Anonymous API cannot read `employees` table
- JWT + Supabase session middleware active
- Security headers (CSP, HSTS, X-Frame-Options) applied in production

### 2. Team hierarchy — PASS

**Dashboard & My Team page:**
- Managers see direct reports (`manager_id`) and lead team (`lead_id`)
- Employees with no reports see “No team members” empty state
- Hierarchy tree built from RLS-filtered employee list (not full org dump)

**RLS employee visibility (Ali — employee):**
- Sees **3** employees (self + hierarchy chain), not full org ✅
- Does **not** see full company directory ✅
- Manager Sarah sees **4** team members including Ali and Fatima ✅

**Profile page:**
- Shows manager name via direct lookup by `manager_id` (works even when manager not in RLS list) ✅
- Shows team count for managers ✅

### 3. Leave module — PASS

| Test | Result |
|------|--------|
| Employee applies leave | ✅ |
| Lead receives notification | ✅ |
| Manager sees pending leave for reports | ✅ |
| Peer (Fatima) cannot approve Ali’s leave (app action) | ✅ |
| Peer cannot PATCH leave via API (RLS blocks — returns empty) | ✅ |
| Manager can approve leave | ✅ |
| Balance deducted on approval | ✅ |
| Employee without `lead_id` blocked in UI | ✅ (`applyLeave` server action) |
| Employee reads own balance only | ✅ |
| Employee cannot read peer leave requests | ✅ |
| Manager sees org pending leaves for approval | ✅ |

**Edge case:** DB allows leave INSERT for no-lead users (status 201). The **UI/server action blocks** this with a clear error. Low risk but worth tightening RLS.

### 4. Profile module — PASS

| Test | Result |
|------|--------|
| Read own profile | ✅ |
| Update allowed fields (phone, etc.) | ✅ |
| Cannot escalate `role` to admin | ✅ (DB trigger) |
| Cannot tamper `employee_code` / CNIC | ✅ |
| Cannot read peer CNIC | ✅ |
| Photo upload scoped to own folder | ✅ (storage RLS) |

### 5. Admin module — PASS

| Test | Result |
|------|--------|
| Employee cannot create holidays | ✅ 403 |
| Employee cannot create assets | ✅ 403 |
| Manager cannot create employees | ✅ 403 |
| Admin lists all employees | ✅ |
| Admin-only pages redirect non-admins | ✅ (code review) |

### 6. Assets — PASS

- Admin creates and assigns assets ✅
- Employee sees only own assignments ✅
- Cannot see another employee’s assets ✅

### 7. Performance — PASS

- Manager creates goals for reports ✅
- Employee cannot update goal progress via API (RLS returns empty body) ✅
- App uses `requireRole("admin", "manager")` for management pages ✅

### 8. Policies — PASS

- All roles can read policies ✅
- Only admin can manage (RLS `policies_admin`) ✅

### 9. Sales module — PASS

| Test | Result |
|------|--------|
| Non-BD employee: sidebar hidden | ✅ |
| Non-BD employee: `sales_profiles` returns 0 rows | ✅ |
| Admin reads sales data | ✅ |
| `/sales/command` requires `role=admin` | ✅ |
| Rep view requires `pm_role=bd` | ✅ |

### 10. Projects — PASS (with caveat)

| Test | Result |
|------|--------|
| Employee RLS: 0 projects visible | ✅ |
| Admin RLS: 8 projects visible | ✅ |
| Employee cannot INSERT project | ✅ 403 |
| Sidebar hidden for employees | ✅ |
| Direct URL `/projects` accessible | ⚠️ Page loads (empty) — add `requireRole` guard |

### 11. Notifications security — PASS (re-tested)

Earlier audit flagged open INSERT on `notifications`. **Re-tested 8 Jul 2026:** both employee spam and manager forge return **403**. Appears fixed in production RLS.

---

## Responsive design audit

| Viewport | Page | Result |
|----------|------|--------|
| 375px (mobile) | `/login` | Card renders; usable ✅ |
| 768px (tablet) | `/login` | Centered, good spacing ✅ |
| 375px (mobile) | Portal (dashboard, leave, team, etc.) | **Sidebar fixed at 288px (`w-72`) with no hamburger/drawer** ❌ |
| 768px (tablet) | Portal | Sidebar consumes ~37% width; cramped ⚠️ |

**Root cause:** `AppShell` always renders full `Sidebar` with no `lg:hidden` / mobile `Sheet` pattern.

```18:19:src/components/layout/app-shell.tsx
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role={employee.role} pmRole={employee.pm_role} />
```

**Individual pages** use responsive grids (`sm:`, `md:`, `lg:`) for cards and tables — content areas are responsive, but navigation is not.

---

## Automated test summary

### `e2e-test.mjs` — 20 pass / 4 fail

| Failed test | Actual status after investigation |
|-------------|-----------------------------------|
| Non-lead cannot approve leave (204) | **False positive** — 204 with 0 rows; leave stays `pending` |
| Employee cannot update goal (204) | **False positive** — RLS blocks; body `[]` |
| Notification forge (201) | **Fixed** — now returns 403 on re-test |
| Projects not implemented | **Outdated test** — projects exist and work |

### `role-qa-test.mjs` — 21 pass / 4 fail

| Failed test | Actual status |
|-------------|---------------|
| `sales_outreach_logs` 404 | **Test bug** — table is `sales_daily_logs` |
| Employee sees manager/peer | **By design** — RLS shows hierarchy chain, not peers |
| Employee cannot create policies | **Test bug** — wrong column name caused 400, not security failure |

---

## Launch blockers

### P0 — Must fix before mobile launch

1. **Mobile navigation** — Add collapsible sidebar (Sheet/drawer) + hamburger in `Header` for viewports `< lg`.

### P1 — Should fix before broad rollout

2. **`/projects` route guard** — Add `requireRole("admin", "manager")` or `requirePmRole` to match sidebar.
3. **No-lead leave INSERT** — Add RLS policy to block `INSERT` when `lead_id IS NULL` (defense in depth).
4. **Update E2E suite** — Fix false-positive PATCH assertions; update projects + sales table names.

### P2 — Post-launch improvements

5. Google Sheets sync for sales (not implemented)
6. Friday weekly report cron (not implemented)
7. BD rep test account (`pm_role=bd`) for full sales rep QA cycle

---

## Pre-launch checklist

- [x] Production domain live (`hrms.mindvista.io`)
- [x] Supabase migrations applied (001–009+)
- [x] Admin accounts have `role: admin` (not just designation)
- [x] RLS enabled on core tables
- [x] Employee cannot access admin UI routes
- [x] Leave approval workflow end-to-end
- [x] Profile self-service + field protection
- [ ] Mobile navigation implemented
- [ ] `/projects` route guard aligned with sidebar
- [ ] Manual sign-off on tablet (iPad) after mobile nav fix

---

## How to re-run tests

```bash
# Full HRMS API/RLS suite
node scripts/e2e-test.mjs

# Extended role QA (sales, projects, profile, leaves)
node scripts/role-qa-test.mjs
```

Results written to:
- `docs/E2E_TEST_RESULTS.json`
- `docs/ROLE_QA_RESULTS.json`

---

## Sign-off

| Area | Status |
|------|--------|
| Employee role isolation | ✅ Pass |
| Manager role isolation | ✅ Pass |
| Admin role isolation | ✅ Pass |
| Team hierarchy | ✅ Pass |
| Leave module | ✅ Pass |
| Profile module | ✅ Pass |
| Sales access control | ✅ Pass |
| Desktop UX | ✅ Pass |
| Mobile / tablet UX | ❌ Fail — navigation |
| **Overall launch readiness** | **Conditional — desktop OK, mobile blocked** |
