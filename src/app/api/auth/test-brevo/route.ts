import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import type { EmailPayload } from "@/lib/email/types";

/**
 * GET /api/auth/test-brevo
 *
 * Diagnostic endpoint — development only.
 * Verifies that Brevo is configured correctly and can send emails.
 *
 * Usage:
 *   GET /api/auth/test-brevo                     → runs config check only
 *   GET /api/auth/test-brevo?send=true           → also sends a test email to EMAIL_FROM
 *   GET /api/auth/test-brevo?send=true&to=x@y.z  → sends test email to specific address
 */
export async function GET(request: NextRequest) {
  // Only allow in development — never expose diagnostics in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const shouldSend = searchParams.get("send") === "true";
  const testRecipient = searchParams.get("to");

  // ── 1. Check env vars ───────────────────────────────────────────────────
  const emailProvider = process.env.EMAIL_PROVIDER || null;
  const brevoKey = process.env.BREVO_API_KEY || null;
  const emailFrom = process.env.EMAIL_FROM || null;
  const emailFromName = process.env.EMAIL_FROM_NAME || null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || null;

  const maskKey = (key: string | null) =>
    key && key.length > 16 ? `${key.slice(0, 12)}...${key.slice(-4)}` : key ? "***" : null;

  const config = {
    EMAIL_PROVIDER: emailProvider,
    BREVO_API_KEY: maskKey(brevoKey),
    EMAIL_FROM: emailFrom,
    EMAIL_FROM_NAME: emailFromName,
    NEXT_PUBLIC_APP_URL: appUrl,
  };

  const issues: string[] = [];
  if (!emailProvider) issues.push("EMAIL_PROVIDER is not set — custom email sending is disabled");
  if (emailProvider && emailProvider !== "brevo") issues.push(`EMAIL_PROVIDER="${emailProvider}" — expected "brevo"`);
  if (!brevoKey) issues.push("BREVO_API_KEY is not set");
  if (!emailFrom) issues.push("EMAIL_FROM is not set — required for sending");
  if (!appUrl) issues.push("NEXT_PUBLIC_APP_URL is not set — reset links will use localhost:3000");

  // ── 2. Optionally send a test email ─────────────────────────────────────
  let sendResult: Record<string, unknown> | null = null;

  if (shouldSend) {
    const recipient = testRecipient || emailFrom;

    if (!recipient) {
      sendResult = {
        ok: false,
        error: "No recipient specified and EMAIL_FROM not set — cannot send test email",
      };
    } else if (!brevoKey || !emailFrom) {
      sendResult = {
        ok: false,
        error: "BREVO_API_KEY or EMAIL_FROM not configured — cannot send",
      };
    } else {
      const testPayload: EmailPayload = {
        to: recipient,
        subject: `[TEST] MindVista Brevo Integration Test — ${new Date().toISOString()}`,
        text: [
          "This is a test email from MindVista HRMS.",
          "",
          `Sent at: ${new Date().toISOString()}`,
          `Provider: ${emailProvider}`,
          `Sender: ${emailFrom}`,
          "",
          "If you received this, Brevo is configured correctly!",
        ].join("\n"),
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:8px">
            <h2 style="color:#6366f1;margin:0 0 12px">Brevo Integration Test</h2>
            <p style="color:#475569;line-height:1.6;margin:0 0 16px">
              This is a test email from <strong>MindVista HRMS</strong>.
              If you received this, your Brevo email integration is working correctly.
            </p>
            <table style="font-size:13px;color:#64748b;border-collapse:collapse;width:100%">
              <tr><td style="padding:4px 8px;border-bottom:1px solid #f1f5f9"><strong>Sent at</strong></td><td style="padding:4px 8px;border-bottom:1px solid #f1f5f9">${new Date().toISOString()}</td></tr>
              <tr><td style="padding:4px 8px;border-bottom:1px solid #f1f5f9"><strong>Provider</strong></td><td style="padding:4px 8px;border-bottom:1px solid #f1f5f9">${emailProvider}</td></tr>
              <tr><td style="padding:4px 8px"><strong>Sender</strong></td><td style="padding:4px 8px">${emailFrom}</td></tr>
            </table>
          </div>
        `,
      };

      try {
        const result = await sendEmail(testPayload);
        sendResult = {
          ok: result.ok,
          provider: result.provider,
          error: result.error,
          recipient,
        };
      } catch (err) {
        sendResult = {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
          recipient,
        };
      }
    }
  }

  // ── 3. Return diagnostic report ─────────────────────────────────────────
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    config,
    issues: issues.length > 0 ? issues : null,
    configOk: issues.length === 0,
    sendTest: sendResult,
    instructions: shouldSend
      ? undefined
      : "Add ?send=true to send a test email. Add &to=you@example.com to specify recipient.",
  });
}
