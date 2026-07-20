# MindVista HRMS — Developer Handoff

**Last updated:** July 5, 2026  
**Active feature branch:** `feature/sales-performance` (not yet merged to `main`)  
**Stack:** Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui · Supabase (Auth + Postgres + Storage)

This document is the primary handoff for the dev team: what is implemented, how to run and test it, and what remains to build.

For the earlier HRMS security audit, see [`DEVELOPER_AUDIT.md`](./DEVELOPER_AUDIT.md).  
For automated HRMS E2E results, see [`FINAL_E2E_REPORT.md`](./FINAL_E2E_REPORT.md).

---

## 1. Executive summary

| Area | Status |
|------|--------|
| Core HRMS (leave, employees, assets, policies, hierarchy) | **Implemented** — see audit doc |
| Projects module | **Implemented** on `main` (migrations `005`–`008`) |
| **Sales performance module** | **Implemented (UI + DB + actions)** on `feature/sales-performance` |
| Google Sheets sync | **Not implemented** — server action stub only |
| Friday weekly report email/cron | **Not implemented** |
| Sales E2E automated tests | **Not written** — manual checklist below |
| Production security hardening | **Partial** — 2 P0 issues in audit still open |

**Design decisions (sales):**

- **ClickUp** = pipeline / task management (unchanged, out of scope)
- **Google Sheets** = active lead counts per LinkedIn profile (7 profiles / 7 sheets planned)
- **CRM `/sales`** = daily activity logging + owner dashboards
- **No modals** for sales admin — all flows use dedicated pages
- **Card/tile pickers** instead of dropdowns for profile and employee selection

---

## 2. Getting started

### 2.1 Clone & install

```bash
git clone https://github.com/abdullahshafiq28/mindvista-crm.git
cd mindvista-crm
git checkout feature/sales-performance   # sales module is here
npm install
cp .env.example .env.local               # fill in Supabase keys
npm run dev
```

Open **http://localhost:3000**

### 2.2 Environment variables (`.env.local`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (client + middleware) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — employee creation, scripts |

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

### 2.3 Database migrations

Run **in order** in Supabase SQL Editor (or `supabase db push` if using Supabase CLI):

| # | File | Purpose |
|---|------|---------|
| 001 | `001_initial_schema.sql` | Core HRMS tables + RLS |
| 002 | `002_seed_data.sql` | Departments, holidays |
| 003 | `003_storage_policies.sql` | Storage buckets policies |
| 004 | `004_hierarchy_notifications.sql` | Manager/lead hierarchy, notifications |
| 005 | `005_project_management.sql` | Projects module |
| 006 | `006_pm_admin_only_and_seed_projects.sql` | PM roles, seed data |
| 007 | `007_fix_project_rls_recursion.sql` | RLS fix |
| 008 | `008_add_priority_and_progress.sql` | Project priority/progress |
| **009** | **`009_sales_performance.sql`** | **Sales module (required for `/sales`)** |

### 2.4 Storage buckets (Supabase Dashboard)

Create if missing:

- `employee-documents` (private)
- `company-policies` (private)
- `assets-media` (private)
- `profile-photos` (public — see audit M5 for hardening)

### 2.5 Utility scripts

| Script | Usage |
|--------|-------|
| `node scripts/create-admin.mjs --email x@y.com --password "..."` | Create auth user + admin employee row |
| `node scripts/fix-admin-role.mjs --email x@y.com` | Promote user to `role: admin`, `pm_role: admin` |
| `node scripts/e2e-test.mjs` | Automated HRMS API/RLS tests (does not cover sales yet) |

---

## 3. Test accounts

### 3.1 Primary accounts

| User | Email | Password | `role` | `pm_role` | Sales access |
|------|-------|----------|--------|-----------|--------------|
| Admin User | `admin@mindvista.io` | `MindVista@2026` | `admin` | `admin` | **Owner** (full) |
| Developer Admin | `dev@mindvista.io` | `MindVista@Dev2026` | `admin` | `admin` | **Owner** (full) |
| Sarah Khan (manager) | `sarah.lead@mindvista.io` | `Test@MindVista2026` | `manager` | `developer` | **None** (unless `pm_role` set to `bd`) |
| Ali Ahmed | `ali.dev@mindvista.io` | `Test@MindVista2026` | `employee` | `developer` | **None** (until `pm_role: bd`) |
| Fatima Noor | `fatima.dev@mindvista.io` | `Test@MindVista2026` | `employee` | `developer` | **None** (until `pm_role: bd`) |

### 3.2 Important: designation ≠ role

The header shows **designation** (e.g. "System Administrator"). Access is controlled by the **`role`** column on `employees`:

- `admin` → full Management sidebar + Sales owner view
- `manager` → limited admin pages
- `employee` → portal only

**Sales rep access:** set `pm_role` to `bd` (Business Development) in Admin → Employees.  
**Sales owner access:** `role` must be `admin`.

After changing `role` or `pm_role`, the user must **sign out and sign back in** (session caches employee data).

---

## 4. Sales module — what is implemented

### 4.1 Routes

| Route | Who can access | Purpose |
|-------|----------------|---------|
| `/sales` | Sales users | Redirects: admin → `/sales/command`, rep → `/sales/my-day` |
| `/sales/command` | `role: admin` | Founder Command Center — team KPIs, scorecards, pipeline table |
| `/sales/weekly` | `role: admin` | Weekly CEO-style report |
| `/sales/admin/profiles` | `role: admin` | List LinkedIn profiles |
| `/sales/admin/profiles/new` | `role: admin` | Create profile (full page) |
| `/sales/admin/profiles/[id]` | `role: admin` | Edit profile (full page) |
| `/sales/admin/targets` | `role: admin` | Set per-rep daily/weekly targets (tile picker) |
| `/sales/my-day` | `admin` or `pm_role: bd` | Profile card picker for today's log |
| `/sales/my-day/[profileId]` | Profile owner or admin | Full-page daily log form |
| `/sales/my-progress` | `admin` or `pm_role: bd` | Rep weekly chart + scorecard |

### 4.2 Access control (code)

| Helper | File | Logic |
|--------|------|-------|
| `canAccessSales()` | `src/lib/auth.ts` | `role === 'admin'` OR `pm_role === 'bd'` |
| `requireSalesAccess()` | `src/lib/auth.ts` | Portal guard for `/sales/*` layout |
| `isSalesOwner()` | `src/lib/auth.ts` | `role === 'admin'` only |
| `requireSalesOwner()` | `src/lib/auth.ts` | Guard for command, weekly, admin pages |

Sidebar shows **Sales** only when `canAccessSales()` is true. For admins, the Sales link goes to `/sales/command`.

### 4.3 Database schema (migration `009`)

```
sales_profiles          — LinkedIn profile per rep (name, employee_id, google_sheet_id, sheet_tab_name)
sales_daily_logs        — One row per profile per day (connections, messages, meetings, etc.)
sales_targets           — Per-employee daily/weekly goals
sales_sheet_snapshots   — Daily pipeline counts from Google Sheets (active_leads, follow_up, intro_call, won_mtd)
```

**RLS summary:**

- Admins (`is_sales_admin()`) see and manage everything
- Reps see only their own profiles, logs, targets, and snapshots for their profiles
- Reps can INSERT/UPDATE only their own daily logs for profiles they own

### 4.4 Server actions

All in `src/actions/sales.ts`:

| Action | Status | Notes |
|--------|--------|-------|
| `submitDailyLog` | ✅ Done | Upsert on `(profile_id, log_date)` |
| `createSalesProfile` / `updateSalesProfile` | ✅ Done | Admin only |
| `upsertSalesTarget` | ✅ Done | Admin only |
| `upsertSheetSnapshot` | ✅ Done | Admin only — **manual call today; no cron** |
| `getCommandCenterData` | ✅ Done | Aggregates logs, targets, snapshots |
| `getMyProgressData` | ✅ Done | Weekly trend + score |
| `getWeeklyReportData` | ✅ Done | Rankings, totals, sheet totals |

### 4.5 Key UI files

```
src/app/(portal)/sales/           — All sales routes
src/components/sales/
  sales-shell.tsx                 — Gradient hero + nav wrapper
  sales-nav.tsx                   — Owner vs rep pill navigation
  profile-picker-cards.tsx        — Large profile cards (not dropdown)
  employee-tile-picker.tsx        — Rep selection tiles
  daily-log-page-form.tsx         — Full-page log form
  profile-form-page.tsx           — Create/edit profile page
  targets-page-client.tsx         — Targets with tile picker
  my-progress-client.tsx          — Recharts area chart
  metric-glow-card.tsx            — Dashboard metric cards
  admin-sales-quick-links.tsx     — Admin shortcuts on daily log page
src/lib/sales/stats.ts            — Aggregation, scoring, week helpers
src/types/database.ts             — SalesProfile, SalesDailyLog, SalesTarget, SalesSheetSnapshot
```

### 4.6 Initial sales setup (admin)

1. Run migration `009_sales_performance.sql`
2. Assign sales reps: Admin → Employees → edit user → set **PM Role** to `Business Development` (`bd`)
3. Create profiles: Sales → Profiles → Create (7 LinkedIn profiles, ~2 per rep)
4. Optional per profile: `google_sheet_id`, `sheet_tab_name` (for future sync)
5. Set targets: Sales → Targets
6. Reps log daily: Sales → Daily Log → pick profile card → submit

---

## 5. Sales module — manual test checklist

Use two browsers (or incognito): one as **admin**, one as **BD rep**.

### 5.1 Admin (owner) tests

- [ ] Sign in as `admin@mindvista.io` — sidebar shows **Management** section
- [ ] Click **Sales** → lands on `/sales/command` (not rep-only view)
- [ ] Nav shows: Command Center, Weekly Report, Profiles, Targets, Daily Log
- [ ] **Profiles → Create** — tile picker assigns employee; profile saves
- [ ] **Targets** — select rep tile; save connections/messages/follow-ups/meetings targets
- [ ] **Command Center** — metrics render; team scorecard lists reps with `pm_role: bd`
- [ ] **Weekly Report** — totals and top performer render
- [ ] **Daily Log** — admin quick-link cards visible; empty state offers "Create profile" (not "ask your admin")
- [ ] Edit profile at `/sales/admin/profiles/[id]` — changes persist
- [ ] Deactivate profile (`is_active: false`) — hidden from rep's my-day

### 5.2 Sales rep (BD) tests

Prerequisite: assign `pm_role: bd` to Ali or Fatima; create at least one profile assigned to them.

- [ ] Sign in as rep — sidebar shows **Sales**; no Management section
- [ ] `/sales` redirects to `/sales/my-day`
- [ ] Nav shows only: Daily Log, My Progress
- [ ] `/sales/command` redirects away (to my-day)
- [ ] `/sales/admin/*` redirects away
- [ ] **My Day** — profile cards visible; tap card → full-page log form
- [ ] Submit log — card shows "Logged" badge; `0/1` → `1/1` completed
- [ ] Edit same profile same day — upsert updates existing row
- [ ] **My Progress** — chart and weekly score render
- [ ] Rep cannot see another rep's profiles or logs (RLS)

### 5.3 Non-sales employee tests

- [ ] Employee with `pm_role: developer` — **no Sales** in sidebar
- [ ] Direct URL `/sales` → redirect to `/dashboard`

### 5.4 Regression after role change

- [ ] Change employee `role` or `pm_role` in admin UI
- [ ] User signs out and back in — sidebar and sales nav reflect new access

---

## 6. Remaining work (prioritized)

### P0 — Required for sales to be useful in production

#### 6.1 Google Sheets sync

**Goal:** Nightly (or hourly) read each profile's Google Sheet tab and upsert `sales_sheet_snapshots`.

**Existing hooks:**

- `sales_profiles.google_sheet_id` + `sheet_tab_name` on each profile
- `upsertSheetSnapshot()` in `src/actions/sales.ts` — can be called from a cron job

**Suggested implementation:**

1. Google Cloud service account with Sheets API read access
2. Share each of the 7 sheets with the service account email
3. Vercel Cron or Supabase Edge Function on schedule
4. Parse columns matching your sheet structure (Date, Client, LinkedIn, Status, etc.)
5. Aggregate counts by status → `active_leads`, `follow_up`, `intro_call`, `trying_to_call`, `won_mtd`
6. Store raw breakdown in `status_breakdown` JSONB
7. Call upsert per profile for `snapshot_date = today`

**Env vars to add:**

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
```

**Files to create (suggested):**

```
src/lib/google/sheets.ts          — fetch + parse sheet rows
src/app/api/cron/sales-sheets/route.ts   — cron entry (verify CRON_SECRET)
```

#### 6.2 Friday weekly report delivery

**Goal:** Every Friday, generate report (reuse `getWeeklyReportData`) and notify admin.

**Options:**

- Email via Resend / SendGrid
- In-app notification to all `role: admin` employees (uses existing `notifications` table)
- Both

**Suggested:** Vercel Cron `0 17 * * 5` (Friday 5 PM PKT) → API route → `getWeeklyReportData` → create notification + optional email.

### P1 — Quality & security (from audit — still open)

| ID | Issue | File / location |
|----|-------|-----------------|
| H1 | Open notification INSERT policy | `004_hierarchy_notifications.sql` |
| H2 | `updateGoalProgress` missing auth | `src/actions/performance.ts` |
| H3 | Open audit log INSERT policy | `001_initial_schema.sql` |
| M2 | No Zod validation on FormData actions | All `src/actions/*` |
| M4 | Orphan auth user if employee insert fails | `src/actions/employees.ts` |

See full details in [`DEVELOPER_AUDIT.md`](./DEVELOPER_AUDIT.md) §3.

### P2 — Sales enhancements (product backlog)

| Feature | Notes |
|---------|-------|
| Sales E2E script | Extend `scripts/e2e-test.mjs` or add `scripts/sales-e2e-test.mjs` |
| Sheet sync admin UI | Manual "Sync now" button on Command Center |
| Historical weekly reports | Store generated reports in a new table |
| Bottleneck alerts | Flag reps who missed 2+ days logging (was in early prototype, removed) |
| AI weekly summary | Future — feed logs + sheet data to LLM |
| Export weekly report PDF | `/sales/weekly` → print/PDF |

### P3 — HRMS gaps (unchanged from audit)

- Employee documents upload UI (`employee_documents` table exists)
- Leave balance enforcement at DB layer
- `employee_code` backfill for older admin records
- Attendance module deprecated (Hubstaff) — `/admin/attendance` still reachable by URL

---

## 7. Automated testing

### 7.1 HRMS E2E (existing)

```bash
node scripts/e2e-test.mjs
```

Creates/uses test users, validates RLS, leave flow, assets, etc.  
**Does not test sales module yet.**

Results written to `docs/E2E_TEST_RESULTS.json`.

### 7.2 Sales E2E (to implement)

Suggested cases for `scripts/sales-e2e-test.mjs`:

1. BD rep can insert daily log for own profile
2. BD rep cannot insert log for another rep's profile
3. Non-BD employee cannot read `sales_profiles`
4. Admin can CRUD profiles and targets
5. `upsertSheetSnapshot` creates row visible on command center query

Use the same `login()` / `api()` helpers from `e2e-test.mjs`.

### 7.3 Build verification

```bash
npm run build
```

Must pass before merge to `main`.

---

## 8. Branch & merge notes

```
main                      — HRMS + projects (no sales)
feature/sales-performance — sales module (commits 51a99fa, f638fe7)
```

**Before merging to `main`:**

1. Confirm migration `009` applied on staging/production Supabase
2. Run manual sales checklist (§5)
3. Run `npm run build`
4. Run `node scripts/e2e-test.mjs` (HRMS regression)
5. Fix or ticket P0 security items if deploying to production

---

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Sales page says "ask your admin" but user is admin | `role` is `employee`, not `admin` | `node scripts/fix-admin-role.mjs --email ...` or Admin → Employees |
| Only Daily Log + My Progress nav | Same as above — rep view | Fix `role`; sign out/in |
| No Management sidebar | User is not `admin` or `manager` | Check `employees.role` |
| Sales link missing | `pm_role` is not `bd` and `role` is not `admin` | Assign BD role or use admin account |
| `/sales` 500 errors | Migration `009` not applied | Run SQL migration |
| Command Center empty scorecard | No employees with `pm_role: bd` | Assign BD role to reps |
| Pipeline table shows `—` | No `sales_sheet_snapshots` rows | Implement Sheets sync or call `upsertSheetSnapshot` manually |
| Changes to role not reflected | Cached session | Sign out and sign back in |

---

## 10. File map (quick reference)

| Area | Path |
|------|------|
| Sales actions | `src/actions/sales.ts` |
| Sales auth | `src/lib/auth.ts` (`requireSalesAccess`, `requireSalesOwner`) |
| Sales stats | `src/lib/sales/stats.ts` |
| Sales migration | `supabase/migrations/009_sales_performance.sql` |
| Sidebar sales link | `src/components/layout/sidebar.tsx` |
| Employee PM role field | `src/components/admin/edit-employee-dialog.tsx` |
| HRMS audit | `docs/DEVELOPER_AUDIT.md` |
| E2E report | `docs/FINAL_E2E_REPORT.md` |
| Create admin script | `scripts/create-admin.mjs` |
| Fix admin role script | `scripts/fix-admin-role.mjs` |

---

## 11. Contact / product context

**Sales data sources (agreed scope):**

| System | Role |
|--------|------|
| ClickUp | Pipeline tasks — do not duplicate in CRM |
| Google Sheets | 7 active-lead trackers (one per LinkedIn profile) |
| MindVista CRM `/sales` | Daily rep activity + owner dashboards |

**Org plan:** ~3–4 BD reps, 7 LinkedIn profiles (2 per rep, one rep has 3).

Questions on scope should be confirmed with the product owner before building P2 items.
