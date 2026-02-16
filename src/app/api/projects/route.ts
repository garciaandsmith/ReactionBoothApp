import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.plan !== "pro") {
    return NextResponse.json(
      { error: "Pro plan required for projects" },
      { status: 403 }
    );
  }

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    include: { _count: { select: { reactions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.plan !== "pro") {
    return NextResponse.json(
      { error: "Pro plan required for projects" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { name, description, brandColor, customIntro, layout } = body;

  if (!name) {
    return NextResponse.json(
      { error: "Project name is required" },
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: {
      name,
      description,
      brandColor,
      customIntro,
      layout: layout || "pip-desktop",
      userId: user.id,
    },
  });

  return NextResponse.json(project);
}
