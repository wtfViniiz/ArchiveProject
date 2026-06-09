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

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getUser(request);

    if (!user) {
      return NextResponse.json({ message: "Nao autenticado" }, { status: 401 });
    }

    const { id } = await params;

    const article = await prisma.article.findUnique({ where: { id } });

    if (!article) {
      return NextResponse.json({ message: "Artigo nao encontrado" }, { status: 404 });
    }

    if (article.authorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ message: "Sem permissao" }, { status: 403 });
    }

    await prisma.article.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete article error:", error);
    return NextResponse.json(
      { message: "Erro ao deletar artigo" },
      { status: 500 }
    );
  }
}
