export interface EmailResponse {
  success: boolean;
  error?: string;
}

export interface EmailProvider {
  sendEmail(to: string, subject: string, html: string): Promise<EmailResponse>;
}

class BrevoEmailProvider implements EmailProvider {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.fromEmail = process.env.EMAIL_FROM || "noreply@yourdomain.com";
    this.fromName = process.env.EMAIL_FROM_NAME || "MindVista HRMS";
  }

  async sendEmail(to: string, subject: string, html: string): Promise<EmailResponse> {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.apiKey,
        },
        body: JSON.stringify({
          sender: {
            name: this.fromName,
            email: this.fromEmail,
          },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errData.message || `Brevo API returned status ${response.status}`,
        };
      }

      return { success: true };
    } catch (error: unknown) {
      return {
        success: false,
        error: (error as Error)?.message || "Unknown error occurred while sending email via Brevo",
      };
    }
  }
}

class ResendEmailProvider implements EmailProvider {
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Resend free tier allows sending from onboarding@resend.dev to the owner's email
    this.fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
  }

  async sendEmail(to: string, subject: string, html: string): Promise<EmailResponse> {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errData.message || `Resend API returned status ${response.status}`,
        };
      }

      return { success: true };
    } catch (error: unknown) {
      return {
        success: false,
        error: (error as Error)?.message || "Unknown error occurred while sending email via Resend",
      };
    }
  }
}

class ConsoleEmailProvider implements EmailProvider {
  async sendEmail(to: string, subject: string, html: string): Promise<EmailResponse> {
    console.log("=== EMAIL SENT (CONSOLE FALLBACK) ===");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML Body:\n${html}`);
    console.log("======================================");
    return { success: true };
  }
}

export function getEmailProvider(): EmailProvider {
  const emailProvider = process.env.EMAIL_PROVIDER?.toLowerCase();
  
  if (emailProvider === "brevo") {
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (brevoApiKey) {
      return new BrevoEmailProvider(brevoApiKey);
    }
  }
  
  if (emailProvider === "resend") {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      return new ResendEmailProvider(resendApiKey);
    }
  }
  
  return new ConsoleEmailProvider();
}
