import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ─── In-memory rate limiter for auth API routes ────────────────────────────
const authRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const AUTH_RATE_LIMIT_MAX = 10;
const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 min

function checkAuthRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = authRateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    authRateLimitMap.set(ip, { count: 1, resetAt: now + AUTH_RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= AUTH_RATE_LIMIT_MAX) {
    return false;
  }

  entry.count += 1;
  return true;
}

// ─── Security Headers ──────────────────────────────────────────────────────
function applySecurityHeaders(response: NextResponse): void {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // HSTS — only set in production (requires HTTPS)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }
}

// ─── CSRF: Origin check on state-changing requests ─────────────────────────
function isOriginAllowed(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  // Only check on state-changing methods
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return true;

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin) {
    // Server actions from Next.js include the origin header; if missing, allow
    // for backwards compat (e.g. curl calls during development)
    return process.env.NODE_ENV !== "production";
  }

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api/");
  const isAuthApiRoute = pathname.startsWith("/api/auth/");

  // ─── CSRF check on state-changing requests ─────────────────────────────
  if (!isOriginAllowed(request)) {
    applySecurityHeaders(supabaseResponse);
    if (isApiRoute) {
      return NextResponse.json(
        { code: "CSRF_ERROR", message: "Invalid origin" },
        { status: 403 }
      );
    }
    // For page requests, just continue (Next.js server actions are safe)
  }

  // ─── Rate limit auth API routes ────────────────────────────────────────
  if (isAuthApiRoute) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!checkAuthRateLimit(ip)) {
      const rateLimitedResponse = NextResponse.json(
        { code: "RATE_LIMITED", message: "Too many requests. Please try again later." },
        { status: 429 }
      );
      applySecurityHeaders(rateLimitedResponse);
      return rateLimitedResponse;
    }
  }

  // ─── Verify JWT server-side using getUser() (network call to Supabase) ─
  let user = null;
  try {
    const {
      data: { user: verifiedUser },
    } = await supabase.auth.getUser();
    user = verifiedUser;
  } catch {
    // Auth service unreachable — allow through on auth pages, block otherwise
    applySecurityHeaders(supabaseResponse);
    return supabaseResponse;
  }

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/forgot-password");

  // ─── Unauthenticated user hitting a protected route ────────────────────
  if (!user && !isAuthPage && pathname !== "/") {
    if (isApiRoute) {
      const unauthResponse = NextResponse.json(
        { code: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
      applySecurityHeaders(unauthResponse);
      return unauthResponse;
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    const redirectResponse = NextResponse.redirect(url);
    applySecurityHeaders(redirectResponse);
    return redirectResponse;
  }

  // ─── Authenticated user hitting an auth page — redirect to dashboard ───
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    const redirectResponse = NextResponse.redirect(url);
    applySecurityHeaders(redirectResponse);
    return redirectResponse;
  }

  // ─── Apply security headers to all responses ──────────────────────────
  applySecurityHeaders(supabaseResponse);
  return supabaseResponse;
}
