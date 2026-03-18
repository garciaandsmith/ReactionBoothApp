import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "backgrounds");
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VALID_SLOTS = new Set(["pip", "sideBySide", "stacked"]);

// POST — upload a background image for a given slot (pip | sideBySide | stacked)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const slot = formData.get("slot") as string | null;

    if (!file || !slot) {
      return NextResponse.json({ error: "file and slot are required" }, { status: 400 });
    }
    if (!VALID_SLOTS.has(slot)) {
      return NextResponse.json({ error: "slot must be pip, sideBySide, or stacked" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Use PNG, JPEG, or WebP" }, { status: 400 });
    }

    const style = await prisma.layoutStyle.findUnique({ where: { id: params.id } });
    if (!style) return NextResponse.json({ error: "Style not found" }, { status: 404 });

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const ext = file.name.split(".").pop() || "png";
    const filename = `style-${params.id}-${slot}-${Date.now()}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buffer);

    const url = `/api/uploads/backgrounds/${filename}`;
    const field = slot === "pip" ? "bgPip" : slot === "sideBySide" ? "bgSideBySide" : "bgStacked";

    await prisma.layoutStyle.update({
      where: { id: params.id },
      data: { [field]: JSON.stringify({ url, type: file.type }) },
    });

    return NextResponse.json({ url, type: file.type, slot });
  } catch (error) {
    console.error("layout background POST error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// DELETE — remove a background for a given slot (?slot=pip|sideBySide|stacked)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const slot = new URL(request.url).searchParams.get("slot");
    if (!slot || !VALID_SLOTS.has(slot)) {
      return NextResponse.json({ error: "Valid slot param required (pip|sideBySide|stacked)" }, { status: 400 });
    }

    const field = slot === "pip" ? "bgPip" : slot === "sideBySide" ? "bgSideBySide" : "bgStacked";
    await prisma.layoutStyle.update({
      where: { id: params.id },
      data: { [field]: null },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("layout background DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove background" }, { status: 500 });
  }
}
