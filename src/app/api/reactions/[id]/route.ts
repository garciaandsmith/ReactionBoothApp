import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reaction = await prisma.reaction.findFirst({
      where: {
        OR: [{ id: params.id }, { boothToken: params.id }],
      },
    });

    if (!reaction) {
      return NextResponse.json(
        { error: "Reaction not found" },
        { status: 404 }
      );
    }

    if (reaction.status === "pending" && new Date() > reaction.expiresAt) {
      await prisma.reaction.update({
        where: { id: reaction.id },
        data: { status: "expired" },
      });
      return NextResponse.json(
        { error: "This reaction link has expired" },
        { status: 410 }
      );
    }

    return NextResponse.json(reaction);
  } catch (error) {
    console.error("Error fetching reaction:", error);
    return NextResponse.json(
      { error: "Failed to fetch reaction" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, selectedLayout } = body;

    const reaction = await prisma.reaction.findUnique({
      where: { id: params.id },
    });

    if (!reaction) {
      return NextResponse.json(
        { error: "Reaction not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status) {
      updateData.status = status;
      if (status === "opened") updateData.openedAt = new Date();
      if (status === "completed") updateData.completedAt = new Date();
    }
    if (selectedLayout) {
      updateData.selectedLayout = selectedLayout;
    }

    const updated = await prisma.reaction.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating reaction:", error);
    return NextResponse.json(
      { error: "Failed to update reaction" },
      { status: 500 }
    );
  }
}
