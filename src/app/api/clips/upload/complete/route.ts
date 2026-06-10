import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";

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

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);

    if (!user) {
      return NextResponse.json({ message: "Nao autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { uploadId, r2Key, title, tags, duration } = body;

    if (!uploadId || !r2Key || !title) {
      return NextResponse.json(
        { message: "uploadId, r2Key e title sao obrigatorios" },
        { status: 400 }
      );
    }

    const videoUrl = getPublicUrl(r2Key);
    const durationNum = duration ? parseFloat(duration) : null;

    const MAX_DURATION = 30;
    if (durationNum && durationNum > MAX_DURATION) {
      return NextResponse.json(
        { message: `Duracao maxima e ${MAX_DURATION} segundos` },
        { status: 400 }
      );
    }

    const tagsArray = tags ? (typeof tags === "string" ? JSON.parse(tags) : tags) : [];

    const clip = await prisma.clip.create({
      data: {
        title,
        videoUrl,
        originalUrl: videoUrl,
        thumbnailUrl: videoUrl,
        fileSize: null,
        duration: durationNum,
        authorId: user.id,
        isApproved: true,
        processingStatus: "completed",
        tags: tagsArray.length > 0
          ? {
              connectOrCreate: tagsArray.map((tagName: string) => ({
                where: { slug: tagName.toLowerCase().replace(/\s+/g, "-") },
                create: {
                  name: tagName,
                  slug: tagName.toLowerCase().replace(/\s+/g, "-"),
                },
              })),
            }
          : undefined,
      },
      include: {
        author: { select: { name: true } },
        tags: { select: { name: true } },
      },
    });

    return NextResponse.json(clip, { status: 201 });
  } catch (error) {
    console.error("Upload complete error:", error);
    const message = error instanceof Error ? error.message : "Erro ao finalizar upload";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
