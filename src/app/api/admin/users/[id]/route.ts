import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH — update a user's plan, role, or status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { plan, role, status, name } = await request.json();
    const updateData: Record<string, string> = {};
    if (plan !== undefined) updateData.plan = plan;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (name !== undefined) updateData.name = name;

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });
    return NextResponse.json(user);
  } catch (error) {
    console.error("Admin update user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE — remove a user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
