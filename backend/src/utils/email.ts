import nodemailer from 'nodemailer';

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const FROM = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@oziblog.com';

export async function sendVerificationEmail(to: string, token: string) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const link = `${frontendUrl}/auth/verify-email?token=${token}`;

  const transport = createTransport();
  if (!transport) {
    // No SMTP configured — log link so dev can verify manually
    console.log(`[EMAIL] Verification link for ${to}: ${link}`);
    return;
  }

  await transport.sendMail({
    from: `"OziBlog" <${FROM}>`,
    to,
    subject: 'Verify your OziBlog account',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px">
        <h2 style="color:#C04878">Welcome to OziBlog!</h2>
        <p>Thanks for signing up. Please verify your email address to activate your account.</p>
        <a href="${link}"
          style="display:inline-block;margin:24px 0;padding:12px 28px;background:#C04878;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Verify Email
        </a>
        <p style="color:#999;font-size:13px">This link expires in 24 hours. If you didn't sign up, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const link = `${frontendUrl}/auth/reset-password?token=${token}`;

  const transport = createTransport();
  if (!transport) {
    console.log(`[EMAIL] Password reset link for ${to}: ${link}`);
    return;
  }

  await transport.sendMail({
    from: `"OziBlog" <${FROM}>`,
    to,
    subject: 'Reset your OziBlog password',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px">
        <h2 style="color:#C04878">Reset your password</h2>
        <p>We received a request to reset the password for your account.</p>
        <a href="${link}"
          style="display:inline-block;margin:24px 0;padding:12px 28px;background:#C04878;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Reset Password
        </a>
        <p style="color:#999;font-size:13px">This link expires in 1 hour. If you didn't request a reset, you can ignore this email.</p>
      </div>
    `,
  });
}
