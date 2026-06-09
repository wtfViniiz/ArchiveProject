import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json({ user: null, session: null });
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ user: null, session: null });
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        avatarUrl: session.user.avatarUrl,
      },
      session: {
        token: session.token,
        expiresAt: session.expiresAt,
      },
    });
  } catch {
    return NextResponse.json({ user: null, session: null });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete("session_token");

    return response;
  } catch {
    return NextResponse.json({ message: "Erro ao fazer logout" }, { status: 500 });
  }
}
