import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (tokenHash && type) {
    const supabase = await createClient();

    let verifyError: { message: string } | null = null;
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      verifyError = error;
    } catch (err) {
      verifyError = { message: err instanceof Error ? err.message : String(err) };
    }

    if (!verifyError) {
      return NextResponse.redirect(new URL(next, origin));
    }

    console.error("[auth/confirm] verifyOtp failed:", verifyError.message);

    // Sign out to clear any stale session — prevents redirect loops when the
    // middleware tries to redirect authenticated users away from /login.
    try {
      await supabase.auth.signOut();
    } catch {
      // signOut failure is non-fatal
    }
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "invalid_link");
  return NextResponse.redirect(loginUrl);
}
