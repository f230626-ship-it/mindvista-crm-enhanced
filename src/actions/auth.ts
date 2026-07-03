"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  loginSchema,
  signupSchema,
  changePasswordSchema,
  requestResetSchema,
  resetPasswordSchema,
} from "@/lib/auth/schemas";
import type { AuthError, AuthResult } from "@/lib/auth/types";
import {
  sendEmail,
  buildPasswordResetEmail,
  buildVerificationEmail,
} from "@/lib/email";

// ─── Helpers ───────────────────────────────────────────────────────────────

function toAuthError(code: string, message: string, field?: string): AuthError {
  return { code, message, field };
}

async function getClientInfo(): Promise<{ ip: string; userAgent: string }> {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";
  return { ip, userAgent };
}

async function writeAuditLog(
  userId: string | null,
  event: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const { ip, userAgent } = await getClientInfo();
    const admin = createAdminClient();
    await admin.rpc("insert_auth_audit_log", {
      p_user_id: userId,
      p_event: event,
      p_ip: ip,
      p_user_agent: userAgent,
      p_metadata: metadata,
    });
  } catch (err) {
    // Audit logging must never block the main flow
    console.error("[auth-audit] Failed to write audit log:", err);
  }
}

// ─── In-memory rate limiter (resets on cold start — acceptable for free tier) ─
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count += 1;
  return true;
}

// ─── LOGIN ─────────────────────────────────────────────────────────────────

export async function login(
  formData: FormData
): Promise<AuthResult<{ redirectTo: string }>> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const firstErr = parsed.error.issues[0];
    return {
      error: toAuthError(
        "VALIDATION_ERROR",
        firstErr.message,
        String(firstErr.path[0])
      ),
    };
  }

  const { email, password } = parsed.data;

  // Rate limit by email (no IP in server actions easily)
  const rlKey = `login:${email.toLowerCase()}`;
  if (!checkRateLimit(rlKey)) {
    await writeAuditLog(null, "login_rate_limited", { email });
    return {
      error: toAuthError(
        "RATE_LIMITED",
        "Too many login attempts. Please try again later."
      ),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    await writeAuditLog(null, "login_failed", { email });
    return {
      error: toAuthError(
        "AUTH_ERROR",
        "Invalid email or password"
      ),
    };
  }

  await writeAuditLog(data.user.id, "login_success", { email });

  revalidatePath("/", "layout");
  return { data: { redirectTo: "/dashboard" } };
}

// ─── LOGOUT ────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await writeAuditLog(user?.id ?? null, "logout");
  await supabase.auth.signOut();
  redirect("/login");
}

// ─── SIGN UP ───────────────────────────────────────────────────────────────

export async function signUp(
  formData: FormData
): Promise<AuthResult<{ message: string }>> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    fullName: formData.get("fullName") as string,
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    const firstErr = parsed.error.issues[0];
    return {
      error: toAuthError(
        "VALIDATION_ERROR",
        firstErr.message,
        String(firstErr.path[0])
      ),
    };
  }

  const { email, password, fullName } = parsed.data;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyRedirect = `${appUrl}/login?verified=true`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      // Supabase sends its own verification email unless we override below
      emailRedirectTo: verifyRedirect,
    },
  });

  if (error) {
    await writeAuditLog(null, "signup_failed", { email });
    // Generic message — don't reveal if email already exists
    return {
      error: toAuthError(
        "AUTH_ERROR",
        "Unable to create account. Please try again or contact support."
      ),
    };
  }

  await writeAuditLog(data.user?.id ?? null, "signup_success", { email });

  // If a custom provider is configured AND the user needs email verification,
  // send a branded verification email instead of the generic Supabase one.
  // We only do this when Supabase didn't auto-confirm (data.session === null).
  if (process.env.EMAIL_PROVIDER && data.user && data.session === null) {
    const admin = createAdminClient();
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: { redirectTo: verifyRedirect },
    });
    const actionLink = linkData?.properties?.action_link;
    if (actionLink) {
      await sendEmail(buildVerificationEmail(actionLink, email));
    }
  }

  return {
    data: {
      message:
        "Account created! Please check your email to verify your address before logging in.",
    },
  };
}

// ─── REQUEST PASSWORD RESET ────────────────────────────────────────────────

export async function requestPasswordReset(
  formData: FormData
): Promise<AuthResult<{ message: string }>> {
  const raw = { email: formData.get("email") as string };

  const parsed = requestResetSchema.safeParse(raw);
  if (!parsed.success) {
    const firstErr = parsed.error.issues[0];
    return {
      error: toAuthError(
        "VALIDATION_ERROR",
        firstErr.message,
        String(firstErr.path[0])
      ),
    };
  }

  const { email } = parsed.data;

  const rlKey = `reset:${email.toLowerCase()}`;
  if (!checkRateLimit(rlKey)) {
    return {
      data: {
        message:
          "If an account exists with that email, a password reset link has been sent.",
      },
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetRedirect = `${appUrl}/reset-password`;

  // If a custom email provider is configured, generate a Supabase magic link
  // via the admin API and send a branded email. Otherwise fall back to
  // Supabase's built-in reset email (rate-limited to ~3-4/hour on free tier).
  if (process.env.EMAIL_PROVIDER) {
    const admin = createAdminClient();
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: resetRedirect },
      });

    if (!linkError && linkData?.properties?.action_link) {
      await sendEmail(
        buildPasswordResetEmail(linkData.properties.action_link, email)
      );
    }
    // Whether the user exists or not, we return the same message (enumeration prevention)
  } else {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetRedirect,
    });
  }

  await writeAuditLog(null, "password_reset_requested", { email });

  // Always return success to not reveal whether email exists
  return {
    data: {
      message:
        "If an account exists with that email, a password reset link has been sent.",
    },
  };
}

// ─── RESET PASSWORD (with OTP token) ──────────────────────────────────────

export async function resetPassword(
  formData: FormData
): Promise<AuthResult<{ message: string }>> {
  const raw = { password: formData.get("password") as string };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const firstErr = parsed.error.issues[0];
    return {
      error: toAuthError(
        "VALIDATION_ERROR",
        firstErr.message,
        String(firstErr.path[0])
      ),
    };
  }

  const { password } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      error: toAuthError("AUTH_ERROR", "Failed to reset password. The link may have expired."),
    };
  }

  await writeAuditLog(data.user?.id ?? null, "password_reset_completed");

  return { data: { message: "Password updated successfully. You can now sign in." } };
}

// ─── CHANGE PASSWORD ───────────────────────────────────────────────────────

export async function changePassword(
  formData: FormData
): Promise<AuthResult<{ message: string }>> {
  const raw = {
    currentPassword: formData.get("currentPassword") as string,
    newPassword: formData.get("newPassword") as string,
  };

  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const firstErr = parsed.error.issues[0];
    return {
      error: toAuthError(
        "VALIDATION_ERROR",
        firstErr.message,
        String(firstErr.path[0])
      ),
    };
  }

  const { currentPassword, newPassword } = parsed.data;

  const supabase = await createClient();

  // Verify current password by re-authenticating
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      error: toAuthError("AUTH_ERROR", "Not authenticated"),
    };
  }

  // Re-auth with current password
  const { error: reAuthErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (reAuthErr) {
    await writeAuditLog(user.id, "password_change_failed", {
      reason: "invalid_current_password",
    });
    return {
      error: toAuthError(
        "AUTH_ERROR",
        "Current password is incorrect",
        "currentPassword"
      ),
    };
  }

  // Update password
  const { error: updateErr } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateErr) {
    return {
      error: toAuthError("AUTH_ERROR", "Failed to update password"),
    };
  }

  await writeAuditLog(user.id, "password_changed");

  // Sign out other sessions by signing out globally, then re-signing in
  const admin = createAdminClient();
  // The admin API can sign out a user from all sessions except the current
  // We sign the user back in on the current session
  await admin.auth.admin.signOut(user.id, "others");

  return {
    data: {
      message:
        "Password changed successfully. All other sessions have been signed out.",
    },
  };
}

// ─── LIST SESSIONS ─────────────────────────────────────────────────────────

export async function listSessions(): Promise<
  AuthResult<{ currentSession: string | null; message: string }>
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: toAuthError("AUTH_ERROR", "Not authenticated") };
  }

  // Supabase free tier does not expose a session listing API.
  // We report that session management is single-session via signOut("others").
  return {
    data: {
      currentSession: user.id,
      message:
        "Session management available. Use 'Sign out other devices' to revoke all other sessions.",
    },
  };
}

// ─── REVOKE OTHER SESSIONS ────────────────────────────────────────────────

export async function revokeOtherSessions(): Promise<
  AuthResult<{ message: string }>
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: toAuthError("AUTH_ERROR", "Not authenticated") };
  }

  const admin = createAdminClient();
  const { error: revokeErr } = await admin.auth.admin.signOut(
    user.id,
    "others"
  );

  if (revokeErr) {
    return {
      error: toAuthError("AUTH_ERROR", "Failed to revoke sessions"),
    };
  }

  await writeAuditLog(user.id, "sessions_revoked", { scope: "others" });

  return {
    data: { message: "All other sessions have been signed out." },
  };
}
