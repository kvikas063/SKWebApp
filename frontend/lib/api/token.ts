import { cookies } from "next/headers";

const TOKEN_COOKIE = "sk-webapp-token";

export function getToken(): string | null {
  try {
    return cookies().get(TOKEN_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

export function setTokenCookie(token: string) {
  try {
    cookies().set(TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
  } catch {}
}

export function clearTokenCookie() {
  try {
    cookies().delete(TOKEN_COOKIE);
  } catch {}
}