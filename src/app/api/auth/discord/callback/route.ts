import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const storedState = request.cookies.get("discord_oauth_state")?.value;

    // Verify state for CSRF protection
    if (!state || state !== storedState) {
      return NextResponse.redirect(new URL("/login?error=invalid_state", request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=no_code", request.url));
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${url.origin}/api/auth/discord/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Failed to exchange code for token");
      return NextResponse.redirect(new URL("/login?error=token_exchange", request.url));
    }

    const tokens = await tokenResponse.json();

    // Get user info from Discord
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error("Failed to fetch user info");
      return NextResponse.redirect(new URL("/login?error=user_fetch", request.url));
    }

    const discordUser = await userResponse.json();

    // Find or create user in database
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: discordUser.email },
          { avatarUrl: { contains: discordUser.id } },
        ],
      },
    });

    if (!user) {
      // Create new user with Discord info
      user = await prisma.user.create({
        data: {
          email: discordUser.email,
          name: discordUser.username,
          passwordHash: crypto.randomUUID(), // Random hash since they use Discord
          avatarUrl: discordUser.avatar
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
            : null,
        },
      });
    } else {
      // Update existing user with Discord avatar
      if (discordUser.avatar) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            avatarUrl: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
          },
        });
      }
    }

    // Create session
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Redirect to home with session cookie
    const response = NextResponse.redirect(new URL("/", request.url));

    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    // Clear the state cookie
    response.cookies.delete("discord_oauth_state");

    return response;
  } catch (error) {
    console.error("Discord callback error:", error);
    return NextResponse.redirect(new URL("/login?error=discord_error", request.url));
  }
}
