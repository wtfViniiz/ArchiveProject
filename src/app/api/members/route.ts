import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true, isBanned: false },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            articles: true,
            posts: true,
            clips: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json(
      { message: "Erro ao buscar membros" },
      { status: 500 }
    );
  }
}
