import nodemailer from "nodemailer";

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

export async function sendBoothInviteEmail(
  recipientEmail: string,
  senderEmail: string,
  boothUrl: string,
  videoTitle: string | null,
  introMessage: string | null
) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: recipientEmail,
    subject: `${senderEmail} sent you a video to react to!`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #6366f1;">ReactionBooth</h2>
        <p><strong>${senderEmail}</strong> wants to see your reaction to a video${videoTitle ? `: <em>${videoTitle}</em>` : ""}!</p>
        ${introMessage ? `<p style="background: #f5f3ff; padding: 12px; border-radius: 8px; color: #4338ca;">"${introMessage}"</p>` : ""}
        <p>Click below to open your private reaction booth. We'll guide you through recording your reaction — it only takes a few minutes.</p>
        <a href="${boothUrl}" style="display: inline-block; padding: 14px 28px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Open Reaction Booth
        </a>
        <p style="color: #666; font-size: 13px; margin-top: 24px;">
          This link is private and unique to you. It will expire in 7 days.
        </p>
      </div>
    `,
  });
}

export async function sendReactionCompleteEmail(
  email: string,
  watchUrl: string,
  isSender: boolean
) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: isSender
      ? "The reaction video is ready!"
      : "Your reaction video is ready!",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #6366f1;">ReactionBooth</h2>
        <p>${isSender ? "Great news! The reaction you requested has been recorded." : "Your reaction video has been processed and is ready to watch."}</p>
        <a href="${watchUrl}" style="display: inline-block; padding: 14px 28px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Watch Reaction
        </a>
      </div>
    `,
  });
}
