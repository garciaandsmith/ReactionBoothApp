import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all users
export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      plan: true,
      role: true,
      status: true,
      createdAt: true,
      _count: {
        select: { sentReactions: true },
      },
    },
  });
  return NextResponse.json(users);
}

// POST — create a user manually
export async function POST(request: NextRequest) {
  try {
    const { email, name, plan, role, status } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        plan: plan || "free",
        role: role || "user",
        status: status || "active",
        emailVerified: new Date(), // Admin-created users are pre-verified
      },
    });
    return NextResponse.json(user);
  } catch (error) {
    console.error("Admin create user error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
