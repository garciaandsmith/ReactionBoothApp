import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all site settings
export async function GET() {
  const settings = await prisma.siteSettings.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  return NextResponse.json(map);
}

// PUT — upsert a setting by key
export async function PUT(request: NextRequest) {
  try {
    const { key, value } = await request.json();
    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }
    const setting = await prisma.siteSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    return NextResponse.json(setting);
  } catch (error) {
    console.error("Admin settings error:", error);
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}
