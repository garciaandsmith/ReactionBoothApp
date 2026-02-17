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
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #6366f1;">ReactionBooth</h2>
        <p>Click the link below to sign in:</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px;">
          Sign In
        </a>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

