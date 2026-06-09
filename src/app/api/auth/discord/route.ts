import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = `${url.origin}/api/auth/discord/callback`;
    const scope = "identify email";

    const state = crypto.randomUUID();

    // Store state in a cookie for CSRF protection
    const response = NextResponse.redirect(
      `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`
    );

    response.cookies.set("discord_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Discord OAuth error:", error);
    return NextResponse.redirect(new URL("/login?error=discord_error", request.url));
  }
}
