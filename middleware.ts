import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/", "/editor", "/projects/:path*"],
};

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith("/api")) return NextResponse.next();
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) return NextResponse.next();

  const access = req.cookies.get("sb-access-token")?.value;
  const refresh = req.cookies.get("sb-refresh-token")?.value;

  if (!access || !refresh) {
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("redirect", pathname + (search || ""));
    return NextResponse.redirect(url);
  }

  // si on est sur "/" → redirige vers /editor
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/editor", req.url));
  }

  return NextResponse.next();
}