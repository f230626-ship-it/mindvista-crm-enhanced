export function getPasswordResetTemplate(resetLink: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 8px;">
      <h2 style="color: #e5a158; font-weight: bold; margin-bottom: 16px;">Password Reset Request</h2>
      <p style="color: #475569; line-height: 1.6;">We received a request to reset the password for your MindVista CRM account. Click the button below to set a new password. This link is valid for 15 minutes.</p>
      <div style="margin: 24px 0;">
        <a href="${resetLink}" style="background-color: #e5a158; color: #12171e; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">If you did not request a password reset, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 11px;">MindVista CRM · Automated Security Notification</p>
    </div>
  `;
}

export function getEmailVerificationTemplate(verificationLink: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 8px;">
      <h2 style="color: #e5a158; font-weight: bold; margin-bottom: 16px;">Verify Your Email Address</h2>
      <p style="color: #475569; line-height: 1.6;">Thank you for registering at MindVista CRM. Please click the button below to verify your email address and activate your account.</p>
      <div style="margin: 24px 0;">
        <a href="${verificationLink}" style="background-color: #e5a158; color: #12171e; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Verify Email</a>
      </div>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">If you did not sign up for an account, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 11px;">MindVista CRM · Automated Security Notification</p>
    </div>
  `;
}
