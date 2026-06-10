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
    const user = await getUser(request);

    if (!user) {
      return NextResponse.json({ message: "Nao autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { content, images, links } = body;

    if (!content || content.length < 10) {
      return NextResponse.json(
        { message: "Conteudo deve ter pelo menos 10 caracteres" },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { message: "Conteudo muito longo (maximo 5000 caracteres)" },
        { status: 400 }
      );
    }

    if (images && images.length > 5) {
      return NextResponse.json(
        { message: "Maximo de 5 imagens" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        content,
        authorId: user.id,
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
