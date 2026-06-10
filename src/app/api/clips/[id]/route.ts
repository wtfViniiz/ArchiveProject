import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const clip = await prisma.clip.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        tags: { select: { name: true, slug: true } },
        comments: {
          include: {
            user: { select: { name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: {
          select: { likes: true, comments: true, awards: true, favorites: true },
        },
      },
    });

    if (!clip) {
      return NextResponse.json({ message: "Clip nao encontrado" }, { status: 404 });
    }

    // Increment view count (optional - can be done via analytics later)

    return NextResponse.json(clip);
  } catch (error) {
    console.error("Get clip error:", error);
    return NextResponse.json(
      { message: "Erro ao buscar clip" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Nao autenticado" }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ message: "Sessao invalida" }, { status: 401 });
    }

    const clip = await prisma.clip.findUnique({ where: { id } });

    if (!clip) {
      return NextResponse.json({ message: "Clip nao encontrado" }, { status: 404 });
    }

    if (clip.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Sem permissao" }, { status: 403 });
    }

    await prisma.clip.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete clip error:", error);
    return NextResponse.json(
      { message: "Erro ao deletar clip" },
      { status: 500 }
    );
  }
}
