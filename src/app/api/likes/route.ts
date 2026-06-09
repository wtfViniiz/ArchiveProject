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
    const { postId, clipId, articleId } = body;

    if (!postId && !clipId && !articleId) {
      return NextResponse.json(
        { message: "Pelo menos um item deve ser especificado" },
        { status: 400 }
      );
    }

    const where: Record<string, string> = { userId: session.user.id };
    if (postId) where.postId = postId;
    if (clipId) where.clipId = clipId;
    if (articleId) where.articleId = articleId;

    const existingLike = await prisma.like.findFirst({ where });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });

      if (postId) {
        await prisma.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        });
      } else if (clipId) {
        await prisma.clip.update({
          where: { id: clipId },
          data: { likeCount: { decrement: 1 } },
        });
      }

      return NextResponse.json({ liked: false });
    }

    const likeData: Record<string, string> = { userId: session.user.id };
    if (postId) likeData.postId = postId;
    if (clipId) likeData.clipId = clipId;
    if (articleId) likeData.articleId = articleId;

    await prisma.like.create({ data: likeData });

    if (postId) {
      await prisma.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      });
    } else if (clipId) {
      await prisma.clip.update({
        where: { id: clipId },
        data: { likeCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error("Toggle like error:", error);
    return NextResponse.json(
      { message: "Erro ao processar like" },
      { status: 500 }
    );
  }
}
