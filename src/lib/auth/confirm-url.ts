/**
 * Build an in-app auth confirmation URL using token_hash.
 * Works reliably with Next.js SSR + @supabase/ssr (avoids PKCE/hash issues).
 */
export function buildAuthConfirmUrl(
  appUrl: string,
  hashedToken: string,
  type: "recovery" | "signup" | "invite" | "magiclink" | "email_change_current" | "email_change_new",
  nextPath: string
): string {
  const params = new URLSearchParams({
    token_hash: hashedToken,
    type,
    next: nextPath,
  });
  return `${appUrl.replace(/\/$/, "")}/auth/confirm?${params.toString()}`;
}
