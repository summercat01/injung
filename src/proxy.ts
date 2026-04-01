import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pages that require auth
const PROTECTED = ['/write', '/profile'];
// Pages that require nickname
const REQUIRES_NICKNAME = ['/write', '/profile'];

export default auth(function middleware(req: NextRequest & { auth: { user?: { id?: string; nickname?: string | null } } | null }) {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Protect certain routes
  if (PROTECTED.some((p) => pathname.startsWith(p))) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Redirect to onboarding if no nickname
  if (REQUIRES_NICKNAME.some((p) => pathname.startsWith(p))) {
    if (session && !session.user?.nickname) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }
  }

  // Redirect logged-in users away from login
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
