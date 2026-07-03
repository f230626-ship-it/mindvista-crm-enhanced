import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySupabaseJwt, extractTokenFromCookieHeader } from "@/lib/auth/jwt";
import { cookies } from "next/headers";

/**
 * GET /api/auth/me
 * Debug endpoint — shows what the server sees from your JWT.
 * Remove or protect this route once done demonstrating.
 */
export async function GET() {
  // 1. Supabase server-side verification
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { authenticated: false, message: "Not logged in" },
      { status: 401 }
    );
  }

  // 2. Local JWT verification (signature + claims)
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join("; ");

  const token = extractTokenFromCookieHeader(cookieHeader);
  const localVerification = token
    ? await verifySupabaseJwt(token)
    : null;

  // Build local verification section with proper type narrowing
  let jwtVerificationResult: Record<string, unknown>;
  if (!localVerification) {
    jwtVerificationResult = { status: "NO TOKEN IN COOKIE" };
  } else if (localVerification.ok) {
    const c = localVerification.claims;
    jwtVerificationResult = {
      status: "VALID ✓",
      algorithm: "ES256 (P-256)",
      issuer: c.iss,
      audience: c.aud,
      expires_at: new Date(c.exp * 1000).toISOString(),
      not_before: c.nbf
        ? new Date(c.nbf * 1000).toISOString()
        : "not set",
    };
  } else {
    jwtVerificationResult = {
      status: "FAILED ✗",
      reason: localVerification.reason,
      detail: localVerification.detail,
    };
  }

  return NextResponse.json({
    authenticated: true,

    supabase_verified: {
      user_id: user.id,
      email: user.email,
      email_confirmed: user.email_confirmed_at !== null,
      last_sign_in: user.last_sign_in_at,
    },

    jwt_custom_claims: {
      app_role: user.app_metadata?.app_role ?? "NOT SET — hook may not be enabled",
      employee_id: user.app_metadata?.employee_id ?? "NOT SET",
    },

    local_jwt_verification: jwtVerificationResult,

    token_present_in_cookie: token !== null,
  });
}
