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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const comments = await prisma.comment.findMany({
      where: { clipId: id },
      include: {
        user: { select: { name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { message: "Erro ao buscar comentarios" },
      { status: 500 }
    );
  }
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
    const body = await request.json();
    const { content } = body;

    if (!content || content.length < 5) {
      return NextResponse.json(
        { message: "Comentario deve ter pelo menos 5 caracteres" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { message: "Comentario muito longo (maximo 2000 caracteres)" },
        { status: 400 }
      );
    }

    const clip = await prisma.clip.findUnique({ where: { id } });
    if (!clip) {
      return NextResponse.json({ message: "Clip nao encontrado" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId: user.id,
        clipId: id,
      },
      include: {
        user: { select: { name: true, avatarUrl: true } },
      },
    });

    await prisma.clip.update({
      where: { id },
      data: { commentCount: { increment: 1 } },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { message: "Erro ao criar comentario" },
      { status: 500 }
    );
  }
}
