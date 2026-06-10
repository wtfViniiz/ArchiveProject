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

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);

    if (!user) {
      return NextResponse.json({ message: "Nao autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { postId, clipId, content, parentId } = body;

    if (!postId && !clipId) {
      return NextResponse.json(
        { message: "Post ou clip deve ser especificado" },
        { status: 400 }
      );
    }

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

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        return NextResponse.json(
          { message: "Comentario pai nao encontrado" },
          { status: 404 }
        );
      }

      if (parentComment.parentId) {
        return NextResponse.json(
          { message: "Maximo de 2 niveis de aninhamento" },
          { status: 400 }
        );
      }
    }

    const commentData = {
      content,
      userId: user.id,
      postId: postId || undefined,
      clipId: clipId || undefined,
      parentId: parentId || undefined,
    };

    const comment = await prisma.comment.create({
      data: commentData,
      include: {
        user: { select: { name: true, avatarUrl: true } },
      },
    });

    if (postId) {
      await prisma.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });
    } else if (clipId) {
      await prisma.clip.update({
        where: { id: clipId },
        data: { commentCount: { increment: 1 } },
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { message: "Erro ao criar comentario" },
      { status: 500 }
    );
  }
}
