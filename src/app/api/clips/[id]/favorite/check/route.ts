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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request);
    const { id } = await params;

    if (!user) {
      return NextResponse.json({ favorited: false });
    }

    const favorite = await prisma.clipFavorite.findFirst({
      where: { userId: user.id, clipId: id },
    });

    return NextResponse.json({ favorited: !!favorite });
  } catch (error) {
    console.error("Check favorite error:", error);
    return NextResponse.json({ favorited: false });
  }
}
