import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

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
    const articles = await prisma.article.findMany({
      where: { isDraft: false },
      include: {
        author: { select: { name: true } },
        tags: { select: { name: true, slug: true } },
        _count: { select: { likes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error("Get articles error:", error);
    return NextResponse.json(
      { message: "Erro ao buscar artigos" },
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
    const { title, content, excerpt, imageUrl, isDraft, tagIds } = body;

    if (!title || !content) {
      return NextResponse.json(
        { message: "Titulo e conteudo sao obrigatorios" },
        { status: 400 }
      );
    }

    if (content.length < 50 && !isDraft) {
      return NextResponse.json(
        { message: "Conteudo deve ter pelo menos 50 caracteres para publicar" },
        { status: 400 }
      );
    }

    let slug = slugify(title);
    const existingArticle = await prisma.article.findUnique({ where: { slug } });
    if (existingArticle) {
      slug = `${slug}-${Date.now()}`;
    }

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        imageUrl,
        isDraft: isDraft ?? false,
        publishedAt: isDraft ? null : new Date(),
        authorId: user.id,
        tags: tagIds?.length
          ? { connect: tagIds.map((id: string) => ({ id })) }
          : undefined,
      },
      include: {
        author: { select: { name: true } },
        tags: { select: { name: true } },
      },
    });

    await prisma.revision.create({
      data: {
        articleId: article.id,
        authorId: user.id,
        content,
        editSummary: "Versao inicial",
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error("Create article error:", error);
    return NextResponse.json(
      { message: "Erro ao criar artigo" },
      { status: 500 }
    );
  }
}
