import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/server/services/authService";
import { parseCookies, SESSION_COOKIE_NAME } from "@/lib/auth/session";

const USER_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#6366f1", // indigo
];

function getDeterministicColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}

/**
 * Health/status check for client to detect if Liveblocks credentials are provided
 */
export async function GET() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY?.trim();
  const publicKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY?.trim();
  const isConfigured = Boolean(secret || publicKey);

  return NextResponse.json({
    configured: isConfigured,
    authMode: secret ? "secret_session" : publicKey ? "public_key" : "unconfigured",
  });
}

/**
 * Main Liveblocks Session Authorization endpoint
 */
export async function POST(request: NextRequest) {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "LIVEBLOCKS_SECRET_KEY is not configured in .env" },
      { status: 401 }
    );
  }

  const liveblocks = new Liveblocks({ secret });

  // Resolve user from session cookie
  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies[SESSION_COOKIE_NAME] ?? null;

  let user = null;
  if (sessionToken) {
    try {
      user = await AuthService.getCurrentUser(sessionToken);
    } catch {
      user = null;
    }
  }

  const userId = user?.id || `guest-${Math.random().toString(36).substring(2, 8)}`;
  const userName = user?.name || `Guest (${userId.slice(-4)})`;
  const userEmail = user?.email || "";
  const color = getDeterministicColor(userId);

  const session = liveblocks.prepareSession(userId, {
    userInfo: {
      name: userName,
      email: userEmail,
      color,
    },
  });

  try {
    const body = await request.json().catch(() => ({}));
    const room = body?.room;
    if (room) {
      session.allow(room, session.FULL_ACCESS);
    } else {
      session.allow("*", session.FULL_ACCESS);
    }

    const { status, body: authBody } = await session.authorize();
    return new NextResponse(authBody, { status });
  } catch (err: unknown) {
    console.error("[liveblocks-auth] Authorization error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Authentication failed" },
      { status: 500 }
    );
  }
}
