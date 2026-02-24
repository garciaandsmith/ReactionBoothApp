import nodemailer from "nodemailer";

function isSmtpConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_HOST !== "smtp.example.com" &&
    process.env.SMTP_USER
  );
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function baseHtml(title: string, body: string) {
  return `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;background:#f7f9f8;padding:32px 16px;">
      <div style="background:#fff;border-radius:16px;padding:32px;border:1px solid #eaeaea;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:800;color:#2ee6a6;letter-spacing:-0.5px;">ReactionBooth</span>
        </div>
        <h2 style="font-size:20px;font-weight:700;color:#121212;margin:0 0 12px;">${title}</h2>
        ${body}
      </div>
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:16px;">
        If you didn&rsquo;t request this, you can safely ignore this email.
      </p>
    </div>
  `;
}

function ctaButton(url: string, label: string) {
  return `
    <a href="${url}" style="display:inline-block;padding:13px 28px;background:#2ee6a6;color:#121212;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;margin:16px 0;">
      ${label}
    </a>
  `;
}

// ── Magic link (NextAuth email provider) ──
export async function sendMagicLinkEmail(email: string, url: string) {
  if (!isSmtpConfigured()) {
    console.log("\n--- Magic Link Email (SMTP not configured) ---");
    console.log(`To: ${email}`);
    console.log(`Sign-in link: ${url}`);
    console.log("---\n");
    return;
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Sign in to ReactionBooth",
    html: baseHtml(
      "Sign in to ReactionBooth",
      `<p style="color:#4b5563;margin:0 0 8px;">Click the link below to sign in. This link expires in 24 hours.</p>
      ${ctaButton(url, "Sign In")}`
    ),
  });
}

// ── Email verification after signup ──
export async function sendVerificationEmail(email: string, url: string) {
  if (!isSmtpConfigured()) {
    console.log("\n--- Email Verification (SMTP not configured) ---");
    console.log(`To: ${email}`);
    console.log(`Verification link: ${url}`);
    console.log("---\n");
    return;
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Verify your ReactionBooth email",
    html: baseHtml(
      "Verify your email address",
      `<p style="color:#4b5563;margin:0 0 8px;">
        Thanks for creating a ReactionBooth account! Please verify your email address to get started.
        This link expires in 24 hours.
      </p>
      ${ctaButton(url, "Verify Email")}`
    ),
  });
}

// ── New signup notification to admins ──
export async function sendNewSignupNotification(newUserEmail: string, adminEmail: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const usersUrl = `${appUrl}/admin/users`;

  if (!isSmtpConfigured()) {
    console.log("\n--- New Signup Notification (SMTP not configured) ---");
    console.log(`New user: ${newUserEmail}`);
    console.log(`Review at: ${usersUrl}`);
    console.log("---\n");
    return;
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: adminEmail,
    subject: `New signup: ${newUserEmail}`,
    html: baseHtml(
      "New user awaiting approval",
      `<p style="color:#4b5563;margin:0 0 16px;">
        A new account has been created and is waiting for your approval.
      </p>
      <p style="color:#121212;font-weight:600;margin:0 0 20px;">${newUserEmail}</p>
      ${ctaButton(usersUrl, "Review in Admin Panel")}
      <p style="color:#9ca3af;font-size:13px;margin-top:16px;">
        New accounts are set to <strong>pending</strong> by default and cannot log in until approved.
      </p>`
    ),
  });
}

// ── Password reset ──
export async function sendPasswordResetEmail(email: string, url: string) {
  if (!isSmtpConfigured()) {
    console.log("\n--- Password Reset Email (SMTP not configured) ---");
    console.log(`To: ${email}`);
    console.log(`Reset link: ${url}`);
    console.log("---\n");
    return;
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Reset your ReactionBooth password",
    html: baseHtml(
      "Reset your password",
      `<p style="color:#4b5563;margin:0 0 8px;">
        We received a request to reset the password for your account.
        This link expires in 1 hour.
      </p>
      ${ctaButton(url, "Reset Password")}
      <p style="color:#9ca3af;font-size:13px;margin-top:8px;">
        If you didn&rsquo;t request a password reset, you can ignore this email &mdash; your password won&rsquo;t change.
      </p>`
    ),
  });
}
