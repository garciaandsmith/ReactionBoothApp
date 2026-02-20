import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Always return 200 to avoid email enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // Invalidate old tokens for this email
    await prisma.passwordResetToken.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    // Create new token (1 hour expiry)
    const resetToken = await prisma.passwordResetToken.create({
      data: {
        email,
        expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken.token}`;
    await sendPasswordResetEmail(email, resetUrl);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
