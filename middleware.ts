// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * On protège uniquement les routes "sensibles".
 * ⚠️ On NE matche PAS "/" pour éviter toute redirection auto de la page d'accueil.
 */
export const config = {
  matcher: ['/editor', '/projects/:path*'], // <-- pas de "/"
};

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Laisse passer l'API, l'auth et les assets Next
  if (pathname.startsWith('/api')) return NextResponse.next();
  if (pathname.startsWith('/auth')) return NextResponse.next();
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) return NextResponse.next();
  if (pathname.startsWith('/_next') || pathname === '/favicon.ico' || pathname.startsWith('/static')) {
    return NextResponse.next();
  }

  // Détermine si l'utilisateur est authentifié (adapte selon ton app)
  // Exemple: cookie Supabase / autre token d'auth
  const isAuthed =
    Boolean(req.cookies.get('sb:token')?.value) ||
    Boolean(req.cookies.get('auth')?.value) ||
    Boolean(req.headers.get('x-user-id'));

  // Si la route est protégée et l'utilisateur n'est pas connecté → redirige vers sign-in
  if (!isAuthed) {
    const url = new URL('/sign-in', req.url);
    url.searchParams.set('redirect', pathname + (search || ''));
    return NextResponse.redirect(url);
  }

  // Sinon on continue
  return NextResponse.next();
}