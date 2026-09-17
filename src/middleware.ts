import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

const publicPaths = ["/login", "/api/auth", "/privacy", "/terms", "/support"];

export async function middleware(req: Request) {
  const { pathname } = new URL(req.url);
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  if (!token && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && pathname === "/login") {
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
