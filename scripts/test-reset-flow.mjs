/**
 * Quick test: verifys the password-reset email flow end-to-end.
 * Usage: node scripts/test-reset-flow.mjs <email>
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/test-reset-flow.mjs <email>");
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BREVO_KEY = process.env.BREVO_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

console.log("=== Password Reset Flow Test ===");
console.log("Email:", email);
console.log("Supabase URL:", SUPABASE_URL?.slice(0, 30) + "...");
console.log("Brevo Key:", BREVO_KEY ? `${BREVO_KEY.slice(0, 12)}...` : "(not set)");
console.log("Email From:", EMAIL_FROM);
console.log("App URL:", APP_URL);
console.log("");

// Step 1: Try generateLink via admin API
console.log("Step 1: admin.auth.admin.generateLink({ type: 'recovery' })");
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
  type: "recovery",
  email: email.toLowerCase().trim(),
  options: { redirectTo: `${APP_URL}/reset-password` },
});

if (linkError) {
  console.error("  generateLink FAILED:", linkError.message);
  console.log("  (This is expected if the user doesn't exist in Supabase auth)");
} else {
  const hashedToken = linkData?.properties?.hashed_token;
  const actionLink = linkData?.properties?.action_link;
  console.log("  hashed_token:", hashedToken ? `${hashedToken.slice(0, 16)}...` : "(null)");
  console.log("  action_link:", actionLink?.slice(0, 80) + "..." || "(null)");

  // Build our custom URL
  const params = new URLSearchParams({
    token_hash: hashedToken,
    type: "recovery",
    next: "/reset-password",
  });
  const resetUrl = `${APP_URL}/auth/confirm?${params.toString()}`;
  console.log("  Custom reset URL:", resetUrl.slice(0, 80) + "...");

  // Step 2: Send email via Brevo
  console.log("\nStep 2: Sending email via Brevo API");
  const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "MindVista HRMS", email: EMAIL_FROM },
      to: [{ email: email.toLowerCase().trim() }],
      subject: "Reset your MindVista password (TEST)",
      textContent: `Reset link: ${resetUrl}`,
      htmlContent: `<p><a href="${resetUrl}">Reset your password</a></p>`,
    }),
  });

  const responseText = await brevoResponse.text();
  console.log("  Brevo HTTP status:", brevoResponse.status);
  console.log("  Brevo response:", responseText);

  if (brevoResponse.ok) {
    console.log("\n  EMAIL SENT SUCCESSFULLY!");
    console.log("  Check your inbox (and spam) for the reset email.");
    console.log("  Click the link to test the /auth/confirm → /reset-password flow.");
  } else {
    console.log("\n  BREVO SEND FAILED!");
  }
}

// Step 3: Also test Supabase's built-in resetPasswordForEmail as fallback
console.log("\nStep 3: supabase.auth.resetPasswordForEmail (fallback test)");
const anon = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { error: resetError } = await anon.auth.resetPasswordForEmail(
  email.toLowerCase().trim(),
  { redirectTo: `${APP_URL}/reset-password` }
);
if (resetError) {
  console.log("  resetPasswordForEmail error:", resetError.message);
} else {
  console.log("  resetPasswordForEmail: OK (Supabase built-in email sent)");
}

console.log("\n=== Test complete ===");
