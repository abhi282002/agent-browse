import { parseCookies, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { AuthService, UserSessionPayload } from "@/server/services/authService";

export interface Context {
  user: UserSessionPayload | null;
  sessionToken: string | null;
  req: Request;
  responseHeaders: Headers;
}

export async function createContext(req: Request): Promise<Context> {
  const cookieHeader = req.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies[SESSION_COOKIE_NAME] ?? null;

  let user: UserSessionPayload | null = null;
  if (sessionToken) {
    try {
      user = await AuthService.getCurrentUser(sessionToken);
    } catch {
      user = null;
    }
  }

  const responseHeaders = new Headers();

  return {
    user,
    sessionToken,
    req,
    responseHeaders,
  };
}
