import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    '/dashboard',
    '/editor',
    '/projects/:path*',
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Laisse passer toujours ces routes
  if (pathname.startsWith('/api')) return NextResponse.next();
  if (pathname.startsWith('/auth')) return NextResponse.next();
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) return NextResponse.next();

  // Test minimal: juste présence des cookies
  const access = req.cookies.get('sb-access-token')?.value;
  const refresh = req.cookies.get('sb-refresh-token')?.value;

  if (!access || !refresh) {
    const url = new URL('/sign-in', req.url);
    // préserve la cible
    const redirectTo = pathname + (search || '');
    url.searchParams.set('redirect', redirectTo);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}