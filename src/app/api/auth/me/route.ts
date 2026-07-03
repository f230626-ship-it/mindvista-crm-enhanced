import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySupabaseJwt, extractTokenFromCookieHeader } from "@/lib/auth/jwt";
import { cookies } from "next/headers";

/**
 * GET /api/auth/me
 *
 * Debug endpoint — shows what the server sees from your JWT.
 * Demonstrates:
 *  1. Supabase-verified user identity (getUser network call)
 *  2. Locally verified JWT claims (signature, exp, iss, aud)
 *  3. Custom claims injected by the access token hook (app_role, employee_id)
 *
 * Remove or protect this route in production once done demonstrating.
 */
export async function GET() {
  // ─── 1. Supabase server-side verification ────────────────────────────────
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { authenticated: false, message: "Not logged in" },
      { status: 401 }
    );
  }

  // ─── 2. Local JWT verification (signature + claims) ───────────────────
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join("; ");

  const token = extractTokenFromCookieHeader(cookieHeader);
  const localVerification = token
    ? await verifySupabaseJwt(token)
    : { ok: false, reason: "NO_TOKEN" };

  // ─── 3. Build response ────────────────────────────────────────────────
  return NextResponse.json({
    authenticated: true,

    // What Supabase confirmed server-side
    supabase_verified: {
      user_id: user.id,
      email: user.email,
      email_confirmed: user.email_confirmed_at !== null,
      last_sign_in: user.last_sign_in_at,
    },

    // Custom claims injected by custom_access_token_hook
    jwt_custom_claims: {
      app_role: user.app_metadata?.app_role ?? "NOT SET — hook may not be enabled",
      employee_id: user.app_metadata?.employee_id ?? "NOT SET",
    },

    // Local cryptographic verification result
    local_jwt_verification: localVerification.ok
      ? {
          status: "VALID ✓",
          algorithm: "ES256 (P-256)",
          issuer: localVerification.claims.iss,
          audience: localVerification.claims.aud,
          expires_at: new Date(localVerification.claims.exp * 1000).toISOString(),
          not_before: localVerification.claims.nbf
            ? new Date(localVerification.claims.nbf * 1000).toISOString()
            : "not set",
        }
      : {
          status: "FAILED ✗",
          reason: (localVerification as { ok: false; reason: string }).reason,
        },

    // Token presence (never log the actual token value)
    token_present_in_cookie: token !== null,
  });
}
