import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      discordMessageId,
      discordChannelId,
      title,
      description,
      discordUserId,
      discordUserName,
      discordUserAvatar,
      videoUrl,
      thumbnailUrl,
      duration,
      category,
      tags,
    } = body;

    // Validate required fields
    if (!discordMessageId || !videoUrl || !discordUserId) {
      return NextResponse.json(
        { message: "Campos obrigatorios nao fornecidos" },
        { status: 400 }
      );
    }

    // Check if clip already exists
    const existingClip = await prisma.clip.findUnique({
      where: { discordMessageId },
    });

    if (existingClip) {
      return NextResponse.json(
        { message: "Clip ja foi indexado" },
        { status: 409 }
      );
    }

    // Check duration limit (30 seconds)
    const MAX_DURATION = 30;
    if (duration && duration > MAX_DURATION) {
      return NextResponse.json(
        { message: `Clip muito longo. Duração máxima é ${MAX_DURATION} segundos` },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: `${discordUserId}@discord.local` },
          { name: discordUserName },
        ],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `${discordUserId}@discord.local`,
          name: discordUserName,
          passwordHash: crypto.randomUUID(),
          avatarUrl: discordUserAvatar,
        },
      });
    }

    // Create clip
    const clip = await prisma.clip.create({
      data: {
        discordMessageId,
        discordChannelId: discordChannelId || "",
        title: title || `clip-${Date.now()}`,
        description,
        discordUserId,
        discordUserName,
        discordUserAvatar,
        videoUrl,
        thumbnailUrl: thumbnailUrl || videoUrl,
        duration: duration || null,
        category: category || "OTHER",
        authorId: user.id,
        isApproved: false, // Needs admin approval
        tags: tags?.length
          ? {
              connectOrCreate: tags.map((tagName: string) => ({
                where: { slug: tagName.toLowerCase().replace(/\s+/g, "-") },
                create: {
                  name: tagName,
                  slug: tagName.toLowerCase().replace(/\s+/g, "-"),
                },
              })),
            }
          : undefined,
      },
      include: {
        author: { select: { name: true } },
        tags: { select: { name: true } },
      },
    });

    return NextResponse.json(clip, { status: 201 });
  } catch (error) {
    console.error("Index clip error:", error);
    return NextResponse.json(
      { message: "Erro ao indexar clip" },
      { status: 500 }
    );
  }
}
