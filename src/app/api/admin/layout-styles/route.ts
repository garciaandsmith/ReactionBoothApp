import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — list all layout styles
export async function GET() {
  const styles = await prisma.layoutStyle.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
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
