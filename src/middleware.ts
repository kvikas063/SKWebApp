import { NextResponse } from "next/server";

const publicPaths = ["/login", "/api/auth", "/privacy", "/terms", "/support"];

export function middleware(req: Request) {
  const { pathname } = new URL(req.url);
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  // Check for the NextAuth session cookie without decoding the JWT.
  // This keeps the Edge Function tiny and avoids needing AUTH_SECRET here.
  const cookieHeader = req.headers.get("cookie") || "";
  const hasSession =
    cookieHeader.includes("authjs.session-token") ||
    cookieHeader.includes("__Secure-authjs.session-token");

  if (!hasSession && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth/.*|.*\\..*).*)"],
};