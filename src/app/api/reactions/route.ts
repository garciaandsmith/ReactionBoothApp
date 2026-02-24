import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { extractYouTubeId, isValidYouTubeUrl } from "@/lib/youtube";
import { checkRateLimit } from "@/lib/rate-limit";
import { PLANS } from "@/lib/constants";
import { isMaintenanceMode } from "@/lib/maintenance";

export async function POST(request: NextRequest) {
  try {
    if (await isMaintenanceMode()) {
      return NextResponse.json(
        { error: "The site is temporarily paused for maintenance. Please try again later." },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { videoUrl, introMessage } = body;

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Video URL is required" },
        { status: 400 }
      );
    }

    if (!isValidYouTubeUrl(videoUrl)) {
      return NextResponse.json(
        { error: "Please provide a valid YouTube URL" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    const plan = user?.plan || "free";
    const rateLimitKey = user?.id || session.user.email;
    const { allowed } = checkRateLimit(rateLimitKey, plan);
    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "Daily reaction limit reached. Upgrade to Pro for unlimited reactions.",
        },
        { status: 429 }
      );
    }

    const planConfig = PLANS[plan as keyof typeof PLANS];
    const videoId = extractYouTubeId(videoUrl);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + planConfig.linkLifespanDays);

    const senderEmail = session.user.email;

    const reaction = await prisma.reaction.create({
      data: {
        videoUrl,
        videoTitle: videoId ? `YouTube Video (${videoId})` : null,
        senderEmail,
        recipientEmail: "",
        senderId: user?.id || null,
        introMessage: introMessage || null,
        watermarked: planConfig.watermark,
        maxVideoLength: planConfig.maxVideoLength,
        expiresAt,
      },
    });

    const boothUrl = `${process.env.NEXT_PUBLIC_APP_URL}/booth/${reaction.boothToken}`;

    return NextResponse.json({
      id: reaction.id,
      boothToken: reaction.boothToken,
      boothUrl,
      expiresAt: reaction.expiresAt,
    });
  } catch (error) {
    console.error("Error creating reaction:", error);
    return NextResponse.json(
      { error: "Failed to create reaction" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  const where: Record<string, unknown> = {
    OR: [
      { senderEmail: session.user.email },
      { recipientEmail: session.user.email },
    ],
  };
  if (projectId) {
    where.projectId = projectId;
  }

  const reactions = await prisma.reaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reactions);
}
