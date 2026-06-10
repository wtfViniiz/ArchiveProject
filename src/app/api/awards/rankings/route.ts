import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Get all users with their awards received and given
    const users = await prisma.user.findMany({
      where: { isActive: true, isBanned: false },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            articles: true,
            posts: true,
            clips: true,
          },
        },
      },
    });

    // Get awards received count for each user
    const awardsReceived = await prisma.clipAward.groupBy({
      by: ["clipId"],
      _count: { id: true },
    });

    // Get awards given count for each user
    const awardsGiven = await prisma.clipAward.groupBy({
      by: ["userId"],
      _count: { id: true },
    });

    // Create a map of awards received by user (via clips they own)
    const clipsWithAwards = await prisma.clip.findMany({
      select: {
        authorId: true,
        _count: { select: { awards: true } },
      },
    });

    const receivedByUser: Record<string, number> = {};
    clipsWithAwards.forEach((clip) => {
      if (clip.authorId) {
        receivedByUser[clip.authorId] = (receivedByUser[clip.authorId] || 0) + clip._count.awards;
      }
    });

    const givenByUser: Record<string, number> = {};
    awardsGiven.forEach((ag) => {
      givenByUser[ag.userId] = ag._count.id;
    });

    // Calculate rankings with formula: score = received + (given * 1.5)
    const rankings = users.map((user) => {
      const received = receivedByUser[user.id] || 0;
      const given = givenByUser[user.id] || 0;
      const score = received + (given * 1.5);

      return {
        ...user,
        awardsReceived: received,
        awardsGiven: given,
        score,
      };
    });

    // Sort by score descending
    rankings.sort((a, b) => b.score - a.score);

    return NextResponse.json(rankings);
  } catch (error) {
    console.error("Get rankings error:", error);
    return NextResponse.json(
      { message: "Erro ao buscar rankings" },
      { status: 500 }
    );
  }
}
