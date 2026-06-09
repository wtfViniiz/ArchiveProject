import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const awards = await prisma.award.findMany({
      include: {
        _count: {
          select: { userAwards: true },
        },
      },
      orderBy: { points: "desc" },
    });

    return NextResponse.json(awards);
  } catch (error) {
    console.error("Get awards error:", error);
    return NextResponse.json(
      { message: "Erro ao buscar premios" },
      { status: 500 }
    );
  }
}
