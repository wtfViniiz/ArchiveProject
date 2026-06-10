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

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { name: true, avatarUrl: true } },
        comments: {
          include: {
            user: { select: { name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ message: "Post nao encontrado" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json(
      { message: "Erro ao buscar post" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await getUser(request);

    if (!user) {
      return NextResponse.json({ message: "Nao autenticado" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ message: "Post nao encontrado" }, { status: 404 });
    }

    if (post.authorId !== user.id) {
      return NextResponse.json({ message: "Sem permissao" }, { status: 403 });
    }

    const hoursSinceCreation = (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return NextResponse.json(
        { message: "Post so pode ser editado ate 24h apos criacao" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content, images, links } = body;

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        content: content || post.content,
        images: images || post.images,
        links: links || post.links,
      },
      include: {
        author: { select: { name: true } },
      },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar post" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await getUser(request);

    if (!user) {
      return NextResponse.json({ message: "Nao autenticado" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ message: "Post nao encontrado" }, { status: 404 });
    }

    if (post.authorId !== user.id) {
      return NextResponse.json({ message: "Sem permissao" }, { status: 403 });
    }

    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { message: "Erro ao deletar post" },
      { status: 500 }
    );
  }
}
