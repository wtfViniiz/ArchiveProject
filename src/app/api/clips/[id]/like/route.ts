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

    const clip = await prisma.clip.findUnique({ where: { id } });
    if (!clip) {
      return NextResponse.json({ message: "Clip nao encontrado" }, { status: 404 });
    }

    const existingLike = await prisma.like.findFirst({
      where: { userId: user.id, clipId: id },
    });

    if (existingLike) {
      try {
        await prisma.like.delete({ where: { id: existingLike.id } });
        await prisma.clip.update({
          where: { id },
          data: { likeCount: { decrement: 1 } },
        });
      } catch {
        // Like might have been already deleted
      }
      return NextResponse.json({ liked: false });
    }

    await prisma.like.create({
      data: { userId: user.id, clipId: id },
    });

    await prisma.clip.update({
      where: { id },
      data: { likeCount: { increment: 1 } },
    });

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error("Toggle like error:", error);
    return NextResponse.json(
      { message: "Erro ao processar like" },
      { status: 500 }
    );
  }
}
