import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPresignedUploadUrl, generateClipKey } from "@/lib/r2";

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
    const { fileName, fileSize, contentType } = body;

    if (!fileName || !fileSize || !contentType) {
      return NextResponse.json(
        { message: "fileName, fileSize e contentType sao obrigatorios" },
        { status: 400 }
      );
    }

    const MAX_SIZE = 300 * 1024 * 1024;
    if (fileSize > MAX_SIZE) {
      return NextResponse.json(
        { message: "Arquivo muito grande. Maximo 300MB" },
        { status: 400 }
      );
    }

    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { message: "Formato nao suportado" },
        { status: 400 }
      );
    }

    const tempId = crypto.randomUUID();
    const extension = fileName.split(".").pop() || "mp4";
    const r2Key = generateClipKey(tempId, "original", extension);

    const presignedUrl = await getPresignedUploadUrl(r2Key, contentType, 3600);

    return NextResponse.json({
      uploadId: tempId,
      presignedUrl,
      r2Key,
    });
  } catch (error) {
    console.error("Get presigned URL error:", error);
    return NextResponse.json(
      { message: "Erro ao gerar URL de upload" },
      { status: 500 }
    );
  }
}
