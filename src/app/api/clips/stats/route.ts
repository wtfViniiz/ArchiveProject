import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [total, approved, pending] = await Promise.all([
      prisma.clip.count(),
      prisma.clip.count({ where: { isApproved: true } }),
      prisma.clip.count({ where: { isApproved: false } }),
    ]);

    return NextResponse.json({
      total,
      approved,
      pending,
    });
  } catch (error) {
    console.error("Get clip stats error:", error);
    return NextResponse.json(
      { message: "Erro ao buscar estatisticas" },
      { status: 500 }
    );
  }
}
