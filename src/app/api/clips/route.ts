import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const tag = url.searchParams.get("tag");
    const search = url.searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      isApproved: true,
      processingStatus: "completed",
    };

    if (tag) {
      where.tags = {
        some: { slug: tag },
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [clips, total] = await Promise.all([
      prisma.clip.findMany({
        where,
        include: {
          author: { select: { name: true, avatarUrl: true } },
          tags: { select: { name: true, slug: true } },
          _count: { select: { likes: true, comments: true, awards: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.clip.count({ where }),
    ]);

    return NextResponse.json({
      clips,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get clips error:", error);
    return NextResponse.json(
      { message: "Erro ao buscar clips" },
      { status: 500 }
    );
  }
}
