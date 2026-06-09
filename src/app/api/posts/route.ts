import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: { select: { name: true, avatarUrl: true } },
        _count: { select: { comments: true, likes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json(
      { message: "Erro ao buscar posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { content, images, links } = body;

    if (!content || content.length < 10) {
      return NextResponse.json(
        { message: "Conteúdo deve ter pelo menos 10 caracteres" },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { message: "Conteúdo muito longo (máximo 5000 caracteres)" },
        { status: 400 }
      );
    }

    if (images && images.length > 5) {
      return NextResponse.json(
        { message: "Máximo de 5 imagens" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        content,
        authorId: session.user.id,
        images: images || [],
        links: links || [],
      },
      include: {
        author: { select: { name: true, avatarUrl: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { message: "Erro ao criar post" },
      { status: 500 }
    );
  }
}
