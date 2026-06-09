import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
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
        { message: "Comentário deve ter pelo menos 5 caracteres" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { message: "Comentário muito longo (máximo 2000 caracteres)" },
        { status: 400 }
      );
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        return NextResponse.json(
          { message: "Comentário pai não encontrado" },
          { status: 404 }
        );
      }

      if (parentComment.parentId) {
        return NextResponse.json(
          { message: "Máximo de 2 níveis de aninhamento" },
          { status: 400 }
        );
      }
    }

    const commentData: Record<string, string> = {
      content,
      userId: session.user.id,
    };

    if (postId) commentData.postId = postId;
    if (clipId) commentData.clipId = clipId;
    if (parentId) commentData.parentId = parentId;

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
      { message: "Erro ao criar comentário" },
      { status: 500 }
    );
  }
}
