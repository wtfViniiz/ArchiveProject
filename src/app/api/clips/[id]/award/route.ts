import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

async function getUser(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

const AWARD_COOLDOWNS: Record<string, number> = {
  rei: 24 * 60 * 60 * 1000, // 24 hours
  true_gooner: 24 * 60 * 60 * 1000, // 24 hours
  gooner: 24 * 60 * 60 * 1000, // 24 hours
  sepe: 24 * 60 * 60 * 1000, // 24 hours
  "88": 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request);

    if (!user) {
      return NextResponse.json({ message: "Nao autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { awardType } = body;

    if (!awardType || !AWARD_COOLDOWNS[awardType]) {
      return NextResponse.json(
        { message: "Tipo de award invalido" },
        { status: 400 }
      );
    }

    const clip = await prisma.clip.findUnique({ where: { id } });
    if (!clip) {
      return NextResponse.json({ message: "Clip nao encontrado" }, { status: 404 });
    }

    // Check cooldown
    const cooldown = AWARD_COOLDOWNS[awardType];
    const recentAward = await prisma.clipAward.findFirst({
      where: {
        userId: user.id,
        awardType,
        awardedAt: {
          gte: new Date(Date.now() - cooldown),
        },
      },
    });

    if (recentAward) {
      const nextAvailable = new Date(recentAward.awardedAt.getTime() + cooldown);
      const timeLeft = nextAvailable.getTime() - Date.now();
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

      return NextResponse.json(
        {
          message: `Proximo award disponivel em ${hours}h ${minutes}m`,
          nextAvailable,
        },
        { status: 429 }
      );
    }

    // Create award
    await prisma.clipAward.create({
      data: {
        clipId: id,
        userId: user.id,
        awardType,
      },
    });

    // Update clip award count
    await prisma.clip.update({
      where: { id },
      data: { awardCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, awardType });
  } catch (error) {
    console.error("Create award error:", error);
    return NextResponse.json(
      { message: "Erro ao criar award" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const awards = await prisma.clipAward.findMany({
      where: { clipId: id },
      include: {
        user: { select: { name: true, avatarUrl: true } },
      },
      orderBy: { awardedAt: "desc" },
    });

    // Group by award type
    const grouped = awards.reduce(
      (acc, award) => {
        if (!acc[award.awardType]) {
          acc[award.awardType] = [];
        }
        acc[award.awardType].push(award);
        return acc;
      },
      {} as Record<string, typeof awards>
    );

    return NextResponse.json({ awards, grouped });
  } catch (error) {
    console.error("Get awards error:", error);
    return NextResponse.json(
      { message: "Erro ao buscar awards" },
      { status: 500 }
    );
  }
}
