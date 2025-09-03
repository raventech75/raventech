// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/', '/((?!_next|static|favicon.ico).*)'], 
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🔥 Rediriger toujours la racine vers /sign-in
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  // --- Laisse passer le reste de tes pages publiques ---
  if (
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/reset') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy')
  ) {
    return NextResponse.next();
  }

  // 🔑 Vérifier l'auth
  const isAuthed = Boolean(req.cookies.get('sb:token')?.value);

  if (!isAuthed) {
    const url = new URL('/sign-in', req.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}