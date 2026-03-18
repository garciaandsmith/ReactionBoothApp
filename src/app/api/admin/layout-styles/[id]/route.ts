import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH — update name and/or set as default
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, isDefault } = body;

    if (isDefault === true) {
      // Unset all other defaults first, then set this one
      await prisma.$transaction([
        prisma.layoutStyle.updateMany({ data: { isDefault: false } }),
        prisma.layoutStyle.update({
          where: { id: params.id },
          data: { isDefault: true, ...(name ? { name: name.trim() } : {}) },
        }),
      ]);
    } else {
      const data: Record<string, unknown> = {};
      if (name !== undefined) data.name = name.trim();
      if (isDefault === false) {
        // Prevent un-defaulting if it's the only default
        const style = await prisma.layoutStyle.findUnique({ where: { id: params.id } });
        if (style?.isDefault) {
          return NextResponse.json({ error: "Cannot remove default — set another style as default first" }, { status: 400 });
        }
        data.isDefault = false;
      }
      await prisma.layoutStyle.update({ where: { id: params.id }, data });
    }

    const updated = await prisma.layoutStyle.findUnique({ where: { id: params.id } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("layout-styles PATCH error:", error);
    return NextResponse.json({ error: "Failed to update style" }, { status: 500 });
  }
}

// DELETE — remove a layout style (cannot delete the default)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const style = await prisma.layoutStyle.findUnique({ where: { id: params.id } });
    if (!style) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (style.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete the active default style. Set another style as default first." },
        { status: 400 }
      );
    }
    await prisma.layoutStyle.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("layout-styles DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete style" }, { status: 500 });
  }
}
