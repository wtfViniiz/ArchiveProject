import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadFile, generateClipKey } from "@/lib/r2";

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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const tags = formData.get("tags") as string;
    const duration = formData.get("duration") as string;

    if (!file) {
      return NextResponse.json(
        { message: "Arquivo e obrigatorio" },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { message: "Titulo e obrigatorio" },
        { status: 400 }
      );
    }

    // Validate file size (max 4MB - Vercel Hobby limit)
    const MAX_SIZE = 4 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { message: "Arquivo muito grande. Maximo 4MB no plano Hobby do Vercel" },
        { status: 400 }
      );
    }

    // Validate content type
    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Formato nao suportado. Use MP4, WebM ou MOV" },
        { status: 400 }
      );
    }

    // Validate duration (max 30s)
    const durationNum = duration ? parseFloat(duration) : null;
    const MAX_DURATION = 30;
    if (durationNum && durationNum > MAX_DURATION) {
      return NextResponse.json(
        { message: `Duracao maxima e ${MAX_DURATION} segundos` },
        { status: 400 }
      );
    }

    // Upload to R2
    const extension = file.name.split(".").pop() || "mp4";
    const tempId = crypto.randomUUID();
    const r2Key = generateClipKey(tempId, "original", extension);

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadFile(r2Key, buffer, file.type);

    // Create clip
    const tagsArray = tags ? JSON.parse(tags) : [];

    const clip = await prisma.clip.create({
      data: {
        title,
        videoUrl: uploadResult.url,
        originalUrl: uploadResult.url,
        thumbnailUrl: uploadResult.url,
        fileSize: file.size,
        duration: durationNum,
        authorId: user.id,
        isApproved: true,
        processingStatus: "processing",
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
    console.error("Upload clip error:", error);
    return NextResponse.json(
      { message: "Erro ao fazer upload" },
      { status: 500 }
    );
  }
}
