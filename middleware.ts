import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  // protège l'éditeur et la racine
  matcher: ["/", "/projects/:path*"],
};

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Laisse passer l'auth, l'API et les assets
  if (pathname.startsWith("/api")) return NextResponse.next();
  if (pathname.startsWith("/auth")) return NextResponse.next();
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) return NextResponse.next();
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon.ico")) return NextResponse.next();

  const access = req.cookies.get("sb-access-token")?.value;
  const refresh = req.cookies.get("sb-refresh-token")?.value;
  const isAuthed = !!access && !!refresh;

  // 1) Si on arrive sur la racine "/"
  if (pathname === "/") {
    // non connecté -> page de login
    if (!isAuthed) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    // connecté -> éditeur
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 2) Toute page protégée (ex: /)
  if (!isAuthed) {
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("redirect", pathname + (search || ""));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}