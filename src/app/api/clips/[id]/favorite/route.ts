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

    const existingFavorite = await prisma.clipFavorite.findFirst({
      where: { userId: user.id, clipId: id },
    });

    if (existingFavorite) {
      await prisma.clipFavorite.delete({ where: { id: existingFavorite.id } });
      return NextResponse.json({ favorited: false });
    }

    await prisma.clipFavorite.create({
      data: { userId: user.id, clipId: id },
    });

    return NextResponse.json({ favorited: true });
  } catch (error) {
    console.error("Toggle favorite error:", error);
    return NextResponse.json(
      { message: "Erro ao processar favorito" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request);

    if (!user) {
      return NextResponse.json({ isFavorited: false });
    }

    const { id } = await params;

    const favorite = await prisma.clipFavorite.findFirst({
      where: { userId: user.id, clipId: id },
    });

    return NextResponse.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error("Check favorite error:", error);
    return NextResponse.json({ isFavorited: false });
  }
}
