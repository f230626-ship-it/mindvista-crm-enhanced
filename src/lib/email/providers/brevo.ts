/**
 * Brevo (formerly Sendinblue) transactional email provider.
 * Free tier: 300 emails/day — more than enough for an HRMS.
 *
 * Required env vars:
 *   BREVO_API_KEY   — from https://app.brevo.com/settings/keys/api
 *   EMAIL_FROM      — verified sender address in your Brevo account
 *   EMAIL_FROM_NAME — display name for the sender (optional, defaults to "MindVista")
 */
import type { EmailPayload, EmailProvider, EmailResult } from "@/lib/email/types";

const BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email";

export const brevoProvider: EmailProvider = {
  name: "brevo",

  async send(payload: EmailPayload): Promise<EmailResult> {
    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.EMAIL_FROM;
    const fromName = process.env.EMAIL_FROM_NAME ?? "MindVista";

    if (!apiKey || !fromEmail) {
      return {
        ok: false,
        provider: "brevo",
        error: "BREVO_API_KEY or EMAIL_FROM not configured",
      };
    }

    try {
      const body: Record<string, unknown> = {
        sender: { name: fromName, email: fromEmail },
        to: [{ email: payload.to }],
        subject: payload.subject,
        textContent: payload.text,
      };

      if (payload.html) {
        body.htmlContent = payload.html;
      }

      const response = await fetch(BREVO_SEND_URL, {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        return {
          ok: false,
          provider: "brevo",
          error: `HTTP ${response.status}: ${errText}`,
        };
      }

      return { ok: true, provider: "brevo" };
    } catch (err) {
      return {
        ok: false,
        provider: "brevo",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
};
