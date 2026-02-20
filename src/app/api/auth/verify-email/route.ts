import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(new URL("/auth/verify-email?error=invalid", request.url));
  }

  const vt = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!vt || vt.identifier !== email || vt.expires < new Date()) {
    return NextResponse.redirect(new URL("/auth/verify-email?error=expired", request.url));
  }

  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({ where: { token } });

  return NextResponse.redirect(new URL("/auth/verify-email?success=1", request.url));
}
