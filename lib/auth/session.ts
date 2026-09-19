import crypto from "crypto";

export const SESSION_COOKIE_NAME = "agentbrowse_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((pair) => {
    const [key, val] = pair.trim().split("=");
    if (key && val) {
      cookies[key] = decodeURIComponent(val);
    }
  });
  return cookies;
}
