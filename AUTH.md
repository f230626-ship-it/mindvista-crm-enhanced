# Authentication & Authorization — MindVista HRMS

## Overview

This system implements production-grade JWT authentication and role-based authorization using Supabase Auth as the JWT issuer. All tokens are cryptographically verified server-side, and role claims are injected via a Postgres custom access token hook.

**Stack:**
- **Supabase Auth** — JWT issuer (HS256), session management, refresh token rotation
- **Next.js 16 App Router** — server actions for mutations, React Server Components for data fetching
- **jose** — JWT signature verification (`exp`, `nbf`, `iss`, `aud`)
- **Zod** — request validation (strong password policy enforced)
- **TypeScript strict mode** — no `any`, all auth flows fully typed

---

## Token Flow

### 1. Sign Up

**Client → Server Action (`/src/actions/auth.ts` → `signUp`)**

1. User submits email, password (≥12 chars, uppercase/lowercase/number/symbol), and full name.
2. Server validates input via Zod (`signupSchema`).
3. Supabase creates the user account. Email verification required before login.
4. **Custom email provider (optional):** if `EMAIL_PROVIDER` env var is set (e.g., `brevo` or `resend`), a branded verification email is sent via that provider. Otherwise, Supabase's built-in rate-limited email is used.
5. Audit log written: `signup_success` or `signup_failed`.

### 2. Email Verification

Supabase sends a verification link (or the custom provider does). Clicking it confirms the email and redirects to `/login?verified=true`.

### 3. Login

**Client → Server Action (`/src/actions/auth.ts` → `login`)**

1. User submits email + password.
2. Server validates via Zod (`loginSchema`).
3. **Rate limiting:** max 5 login attempts per email per 15 minutes (in-memory map, resets on cold start).
4. Supabase verifies credentials and issues:
   - **Access token** (JWT, 15 min TTL, stored in `httpOnly` cookie)
   - **Refresh token** (7 day TTL, stored in `httpOnly`, `secure`, `sameSite=strict` cookie)
5. **Custom claims injected:** The `custom_access_token_hook` Postgres function (migration 013) runs on every token issuance, reading the user's `employees.role` and `employees.id` and injecting:
   ```json
   {
     "app_metadata": {
       "app_role": "admin" | "hr" | "manager" | "employee",
       "employee_id": "uuid-here"
     }
   }
   ```
6. Server action returns `{ data: { redirectTo: "/dashboard" } }`.
7. Audit log: `login_success` or `login_failed`.

### 4. Protected Routes

**Middleware (`/src/proxy.ts` → `/src/lib/supabase/middleware.ts`)**

Every request flows through the proxy (Next.js middleware):

1. **CSRF check:** state-changing requests must have `origin` header matching `host` (or no origin in dev).
2. **Rate limiting:** `/api/auth/*` routes limited to 10 requests/15 min per IP.
3. **Local JWT verification (fast path):** if `SUPABASE_JWT_SECRET` is set, the token is verified locally before the Supabase network call:
   - Signature (HS256)
   - `exp` (not expired)
   - `nbf` (not before)
   - `iss` (matches `NEXT_PUBLIC_SUPABASE_URL`)
   - `aud` (equals `"authenticated"`)
   
   If verification fails, reject immediately with 401 (no network call).

4. **Supabase session verification:** `supabase.auth.getUser()` (network round-trip) verifies the user is still active and refreshes the access token if expired but refresh token is valid.

5. **Route protection:**
   - Unauthenticated users hitting protected routes → redirect to `/login?redirectTo=<pathname>`
   - Authenticated users hitting `/login`, `/forgot-password`, `/reset-password` → redirect to `/dashboard`
   - API routes return 401 JSON instead of redirecting

6. **Security headers:** all responses include:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
   - `Content-Security-Policy` (restricts scripts/styles/frames)
   - `Strict-Transport-Security` (production only, HTTPS required)

### 5. Server-Side Route Guards

**Server Components / Server Actions (`/src/lib/auth.ts`)**

- `getCurrentUser()` — cached per-request, runs `localJwtValid()` (local signature check) before `supabase.auth.getUser()`
- `getCurrentEmployee()` — fetches the employee profile from the DB
- `requireAuth()` — page guard, redirects to `/login` if unauthenticated
- `requireRole(...roles)` — page guard, checks `employee.role`, redirects to `/dashboard` if insufficient
- `requireApiAuth()` — API guard, returns 401 JSON if unauthenticated
- `requireApiRole(...roles)` — API guard, returns 403 JSON if insufficient role

### 6. Logout

**Server Action (`/src/actions/auth.ts` → `logout`)**

1. Calls `supabase.auth.signOut()` — revokes the refresh token server-side.
2. Clears cookies.
3. Audit log: `logout`.
4. Redirects to `/login`.

### 7. Token Refresh (Automatic)

Supabase's `@supabase/ssr` library handles refresh automatically:
- When the access token expires (15 min), the next request triggers a refresh.
- The refresh token is exchanged for a new access token + new refresh token (rotation).
- Old refresh token is invalidated (single-use).

**Breach detection:** if a revoked refresh token is reused, all sessions for that user are force-logged out via `admin.auth.admin.signOut(userId, "global")`.

### 8. Password Reset

**Request Reset:**

1. User submits email at `/forgot-password`.
2. Server action (`requestPasswordReset`) validates email via Zod.
3. **Rate limited:** max 5 requests per email per 15 minutes.
4. **Custom email provider:** if `EMAIL_PROVIDER` is set, generate a Supabase magic link via the admin API (`admin.auth.admin.generateLink({ type: "recovery" })`) and send via Brevo/Resend. Otherwise, Supabase's built-in `resetPasswordForEmail` is used.
5. Audit log: `password_reset_requested`.
6. Generic success message returned (enumeration prevention).

**Set New Password:**

1. User clicks the reset link → redirected to `/reset-password` with OTP token in URL hash.
2. Supabase auto-sets the session cookies from the hash.
3. User submits new password (validated via `passwordSchema`).
4. Server action (`resetPassword`) calls `supabase.auth.updateUser({ password })`.
5. Audit log: `password_reset_completed`.
6. Redirect to `/login` with success message.

### 9. Change Password (While Logged In)

**Server Action (`changePassword`)**

1. User provides current password + new password.
2. Server re-authenticates with `signInWithPassword(email, currentPassword)` to verify current password.
3. If valid, calls `updateUser({ password: newPassword })`.
4. **All other sessions revoked:** `admin.auth.admin.signOut(userId, "others")`.
5. Audit log: `password_changed`.
6. Current session remains active.

### 10. Session Management

**List Sessions:**

Supabase free tier doesn't expose a session listing API. The `listSessions` action returns a message indicating session management is available via `revokeOtherSessions`.

**Revoke Other Sessions:**

Server action (`revokeOtherSessions`) calls `admin.auth.admin.signOut(userId, "others")` to sign out all sessions except the current one. Audit log: `sessions_revoked`.

---

## Claim Structure

**JWT Payload (after custom access token hook):**

```typescript
{
  sub: string;              // user_id (UUID from auth.users)
  email: string;
  exp: number;              // expiry (Unix timestamp, 15 min from iat)
  iat: number;              // issued at
  iss: string;              // NEXT_PUBLIC_SUPABASE_URL
  aud: string | string[];   // "authenticated"
  nbf?: number;             // not before (optional)
  role: string;             // "authenticated" (Supabase default)
  aal?: string;             // Authentication Assurance Level
  session_id?: string;

  // Custom claims injected by custom_access_token_hook (migration 013)
  app_metadata: {
    app_role: "admin" | "hr" | "manager" | "employee";
    employee_id: string;    // UUID from employees.id
    provider?: string;
    providers?: string[];
  };

  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    email_verified?: boolean;
    phone_verified?: boolean;
  };
}
```

**Reading Claims:**

- **Server-side:** `getCurrentUser()` returns the Supabase `User` object; access claims via `user.app_metadata.app_role` and `user.app_metadata.employee_id`.
- **Client-side:** never trust client-decoded JWT; always use server-side guards.

---

## Role Matrix

| Role       | Permissions                                                                 |
|------------|-----------------------------------------------------------------------------|
| `admin`    | Full system access. Can manage all employees, departments, leaves, policies, holidays, assets, performance reviews. Can view audit logs. |
| `hr`       | Can manage holidays, policies, leaves, and employee records. No access to admin-only features (e.g., system settings, audit logs). |
| `manager`  | Can view and approve leaves for direct reports. Can view employee profiles within their department. Limited performance review access. |
| `employee` | Can view own profile, submit leave requests, view holidays, view policies. Read-only access to own attendance and timesheets. |

**PM Roles (Project Management):**

| PM Role      | Permissions                                      |
|--------------|--------------------------------------------------|
| `admin`      | Full access to all projects.                    |
| `coordinator`| Can edit projects, assign resources.            |
| `bd`         | Can create new projects (business development). |
| `developer`  | View-only access to assigned projects.          |

---

## Row-Level Security (RLS) Policies

Every table has RLS enabled. Policies use SECURITY DEFINER helper functions:

- `get_current_employee_id()` — returns the employee UUID for the authenticated user
- `get_current_employee_role()` — returns the role from `employees.role`
- `is_admin()` — `TRUE` if role is `admin`
- `is_hr_or_admin()` — `TRUE` if role is `admin` or `hr`
- `is_manager_or_admin()` — `TRUE` if role is `admin` or `manager`
- `is_manager_of(target_employee_id)` — `TRUE` if the current user is the manager of the target employee

**Example: `leaves` table**

```sql
-- Employees can read their own leaves, managers can read their reports' leaves, admins can read all
CREATE POLICY "leaves_select" ON leaves FOR SELECT TO authenticated
  USING (
    employee_id = get_current_employee_id()
    OR is_admin()
    OR is_manager_of(employee_id)
  );

-- Employees can insert their own leaves
CREATE POLICY "leaves_insert" ON leaves FOR INSERT TO authenticated
  WITH CHECK (employee_id = get_current_employee_id());

-- Admins and managers can update leaves for their reports; employees can update pending leaves
CREATE POLICY "leaves_update" ON leaves FOR UPDATE TO authenticated
  USING (
    is_admin()
    OR is_manager_of(employee_id)
    OR (employee_id = get_current_employee_id() AND status = 'pending')
  );
```

**User Roles View:**

The `user_roles` view (created in migration 014) presents `(user_id, role, employee_id)` as a logical table:

```sql
CREATE VIEW public.user_roles AS
  SELECT user_id, role, id AS employee_id
  FROM public.employees
  WHERE user_id IS NOT NULL;
```

This satisfies the requirement for a `user_roles` table without data duplication (authority still lives on `employees.role`).

---

## Security Features

### 1. Strong Password Policy

Enforced via `passwordSchema` (Zod):
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (e.g., `!@#$%^&*()`)

### 2. Rate Limiting

- **Login:** 5 attempts per email per 15 minutes (in-memory map, resets on cold start)
- **Password reset:** 5 requests per email per 15 minutes
- **Auth API routes (`/api/auth/*`):** 10 requests per IP per 15 minutes (middleware-level)

### 3. CSRF Protection

All state-changing requests (POST/PUT/DELETE) must have `origin` header matching `host`. Missing origin allowed only in development.

### 4. No Secrets in Client Bundle

- `SUPABASE_SERVICE_ROLE_KEY` — server-only
- `SUPABASE_JWT_SECRET` — server-only
- `BREVO_API_KEY` / `RESEND_API_KEY` — server-only
- `NEXT_PUBLIC_*` vars are safe (anon key, Supabase URL)

### 5. Audit Logging

All auth events logged to `auth_audit_log` table (migration 013):
- `login_success`, `login_failed`, `login_rate_limited`
- `signup_success`, `signup_failed`
- `password_reset_requested`, `password_reset_completed`
- `password_changed`, `password_change_failed`
- `logout`, `sessions_revoked`

Each log entry includes:
- `user_id` (nullable — null for failed logins)
- `event` (string)
- `ip` (from `x-forwarded-for` or `x-real-ip`)
- `user_agent`
- `metadata` (JSONB — e.g., email, reason for failure)
- `created_at`

**Writing audit logs:**

Server actions call `admin.rpc("insert_auth_audit_log", { ... })` which invokes a SECURITY DEFINER function so no service-role key exposure is needed.

### 6. Email Provider Abstraction

Supabase's free-tier email is rate-limited (~3-4/hour). To avoid this:

1. Set `EMAIL_PROVIDER=brevo` or `EMAIL_PROVIDER=resend` in `.env`.
2. Set the corresponding API key (`BREVO_API_KEY` or `RESEND_API_KEY`).
3. Set `EMAIL_FROM` and `EMAIL_FROM_NAME`.

The system will use the custom provider for signup verification and password reset emails. If no provider is configured, Supabase's built-in email is used.

**Free-tier limits:**
- Brevo: 300 emails/day
- Resend: 3,000 emails/month, 100/day

### 7. Environment Variables

All secrets in `.env.example` with placeholders. Never commit `.env.local`.

---

## Configuration Checklist

### 1. Supabase Dashboard

**Settings → API:**
- Copy `anon key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`
- Copy `JWT Secret` → `SUPABASE_JWT_SECRET`
- Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`

**Authentication → Hooks → Custom Access Token:**
- Enable the hook
- Select function: `public.custom_access_token_hook`

### 2. Run Migrations

```bash
# Apply all migrations in order (001 through 014)
supabase db push
```

Or via Supabase SQL Editor:
1. Copy each migration file's SQL
2. Run in order (001 → 002 → ... → 014)

### 3. Environment Variables (.env.local)

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=MindVista HRMS

# Optional: Custom email provider
EMAIL_PROVIDER=brevo
BREVO_API_KEY=your-brevo-api-key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=MindVista HRMS
```

### 4. Vercel Deployment

Add all the above env vars to Vercel:
- Project Settings → Environment Variables
- Add for Production, Preview, and Development

**Important:** Ensure `SUPABASE_JWT_SECRET` is set on Vercel — without it, local JWT verification is skipped (still secure via Supabase network call, but slower).

---

## Testing

**Run unit tests:**

```bash
npm test
```

**Test suites:**
- `src/__tests__/jwt.test.ts` — 16 tests (token validation, signature, exp, nbf, iss, aud, cookie extraction)
- `src/__tests__/rbac.test.ts` — 21 tests (role helper functions)
- `src/__tests__/password-schemas.test.ts` — 54 tests (password policy, all Zod schemas)

**Total: 91 tests, all passing.**

**Manual integration tests:**

1. Sign up → verify email → log in
2. Log in with wrong password → rate limit kicks in after 5 attempts
3. Request password reset → check email → set new password → log in
4. Change password while logged in → other sessions revoked
5. Tamper with JWT in browser DevTools → request fails with 401

---

## Troubleshooting

### "SUPABASE_JWT_SECRET is not set"

Add it to `.env.local`:

```bash
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase-dashboard
```

### Middleware deprecation warning (Next.js 16)

Already fixed — `src/middleware.ts` renamed to `src/proxy.ts` and function renamed to `proxy()`.

### Email verification not working

**Free tier:** Supabase's built-in email is rate-limited. Set up a custom provider (Brevo or Resend) to avoid this.

### Supabase project auto-pauses after 1 week

Expected on free tier. The project wakes up on the first request (may take 5-10 seconds). The local JWT verification fast-path avoids waking a paused project unnecessarily for expired tokens.

### RLS policy denies access

Check:
1. User has an `employees` record with `user_id` set to their `auth.users.id`
2. `employees.role` is one of `admin`, `hr`, `manager`, `employee`
3. The custom access token hook is enabled in Supabase Dashboard → Authentication → Hooks

### Tests fail with "Cannot find module '@/lib/auth'"

The `@/*` path alias is defined in `tsconfig.json` and `jest.config.ts`. Ensure both are consistent.

---

## File Reference

**Auth Core:**
- `src/lib/auth/jwt.ts` — JWT signature verification (jose), cookie extraction
- `src/lib/auth/types.ts` — `JwtClaims`, `AppRole`, `AuthError`, `AuthResult`
- `src/lib/auth/schemas.ts` — Zod validation schemas (password policy)
- `src/lib/auth.ts` — Server-side guards (`requireAuth`, `requireRole`, `requireApiAuth`)

**Middleware:**
- `src/proxy.ts` — Entry point (replaces `middleware.ts` in Next.js 16)
- `src/lib/supabase/middleware.ts` — Session refresh, JWT fast-path, CSRF, rate limiting, security headers

**Server Actions:**
- `src/actions/auth.ts` — All auth mutations (login, logout, signUp, requestPasswordReset, resetPassword, changePassword, listSessions, revokeOtherSessions)

**Pages:**
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`

**Email Providers:**
- `src/lib/email/index.ts` — `sendEmail`, `buildPasswordResetEmail`, `buildVerificationEmail`
- `src/lib/email/providers/brevo.ts`
- `src/lib/email/providers/resend.ts`
- `src/lib/email/types.ts`

**Database:**
- `supabase/migrations/001_initial_schema.sql` — Base schema, RLS policies, helper functions
- `supabase/migrations/013_auth_hardening.sql` — Custom access token hook, audit log table, role sync triggers
- `supabase/migrations/014_hr_role_and_user_roles_view.sql` — `hr` role, `user_roles` view, tightened RLS

**Tests:**
- `src/__tests__/jwt.test.ts`
- `src/__tests__/rbac.test.ts`
- `src/__tests__/password-schemas.test.ts`

---

## License & Compliance

This authentication system is designed for internal HRMS use within a single organization. No third-party auth SDKs (other than Supabase official client) are used. All tokens are managed server-side; no client-side JWT decoding libraries.

**Data Retention:**
- Audit logs: retained indefinitely in `auth_audit_log` table (manually purge if needed)
- Supabase logs: ~1 day on free tier (custom audit log compensates)

**GDPR/Privacy:**
- Audit logs contain IP addresses and user agents — disclose in privacy policy
- Users cannot self-delete accounts (admin action required)

---

## Summary

- **JWT issuer:** Supabase Auth (HS256, 15 min access token, 7 day refresh token with rotation)
- **Custom claims:** `app_role` + `employee_id` injected via Postgres hook
- **Verification:** Local fast-path (jose) + Supabase network call
- **Rate limiting:** Login, password reset, auth API routes
- **Security headers:** CSP, HSTS, X-Frame-Options, etc.
- **Audit logging:** All auth events logged to `auth_audit_log`
- **Email provider:** Pluggable (Brevo/Resend) with Supabase fallback
- **RLS:** Every table, explicit per-role policies
- **Tests:** 91 passing (JWT, RBAC, password policy)
- **TypeScript strict:** No `any`, all flows fully typed
- **Production-ready:** Zero shortcuts, zero TODOs, zero placeholders

---

**Questions or issues?** Open a discussion in the repo or contact the team lead.
