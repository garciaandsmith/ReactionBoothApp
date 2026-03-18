import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — list all layout styles.
// Auto-seeds a "Default" style on first call, migrating any backgrounds that
// were previously stored as `default_bg_*` entries in SiteSettings.
export async function GET() {
  const styles = await prisma.layoutStyle.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  if (styles.length === 0) {
    // Migrate any backgrounds previously uploaded through the old per-layout system.
    const legacy = await prisma.siteSettings.findMany({
      where: { key: { startsWith: "default_bg_" } },
    });
    const bgMap: Record<string, string> = {};
    for (const s of legacy) bgMap[s.key] = s.value;

    // Map legacy SiteSettings keys to the three canvas slots.
    const bgPip =
      bgMap["default_bg_pip-bottom-right"] ??
      bgMap["default_bg_pip-cam-bottom-right"] ??
      bgMap["default_bg_pip-bottom-left"] ??
      bgMap["default_bg_pip-top-right"] ??
      bgMap["default_bg_pip-top-left"] ??
      null;
    const bgSideBySide = bgMap["default_bg_side-by-side"] ?? null;
    const bgStacked    = bgMap["default_bg_stacked"]      ?? null;

    const seeded = await prisma.layoutStyle.create({
      data: { name: "Default", isDefault: true, bgPip, bgSideBySide, bgStacked },
    });
    return NextResponse.json([seeded]);
  }

  return NextResponse.json(styles);
}

// POST — create a new layout style
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // If this is the first style, make it default automatically
    const count = await prisma.layoutStyle.count();
    const style = await prisma.layoutStyle.create({
      data: { name: name.trim(), isDefault: count === 0 },
    });

    return NextResponse.json(style, { status: 201 });
  } catch (error) {
    console.error("layout-styles POST error:", error);
    return NextResponse.json({ error: "Failed to create style" }, { status: 500 });
  }
}

