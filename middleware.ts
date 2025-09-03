// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/', '/editor', '/projects/:path*'], // on remet "/" explicitement
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Redirection spéciale pour la racine
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  // --- le reste de ta logique (auth, etc.) ---
  if (pathname.startsWith('/api')) return NextResponse.next();
  if (pathname.startsWith('/auth')) return NextResponse.next();
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))
    return NextResponse.next();
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  const isAuthed = Boolean(req.cookies.get('sb:token')?.value);

  if (!isAuthed) {
    const url = new URL('/sign-in', req.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}