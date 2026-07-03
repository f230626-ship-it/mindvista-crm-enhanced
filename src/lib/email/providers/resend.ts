/**
 * Resend transactional email provider.
 * Free tier: 3 000 emails/month, 100/day — suitable for an HRMS.
 *
 * Required env vars:
 *   RESEND_API_KEY  — from https://resend.com/api-keys
 *   EMAIL_FROM      — verified sender (e.g. noreply@yourdomain.com)
 *   EMAIL_FROM_NAME — display name (optional, defaults to "MindVista")
 *
 * Note: Resend's free tier requires you to verify a domain or use
 *   onboarding@resend.dev as the sender while testing.
 */
import type { EmailPayload, EmailProvider, EmailResult } from "@/lib/email/types";

const RESEND_SEND_URL = "https://api.resend.com/emails";

export const resendProvider: EmailProvider = {
  name: "resend",

  async send(payload: EmailPayload): Promise<EmailResult> {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM;
    const fromName = process.env.EMAIL_FROM_NAME ?? "MindVista";

    if (!apiKey || !fromEmail) {
      return {
        ok: false,
        provider: "resend",
        error: "RESEND_API_KEY or EMAIL_FROM not configured",
      };
    }

    try {
      const body: Record<string, unknown> = {
        from: `${fromName} <${fromEmail}>`,
        to: [payload.to],
        subject: payload.subject,
        text: payload.text,
      };

      if (payload.html) {
        body.html = payload.html;
      }

      const response = await fetch(RESEND_SEND_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        return {
          ok: false,
          provider: "resend",
          error: `HTTP ${response.status}: ${errText}`,
        };
      }

      return { ok: true, provider: "resend" };
    } catch (err) {
      return {
        ok: false,
        provider: "resend",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
};
