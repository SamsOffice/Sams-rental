import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow: login page, client portal, driver page, static files
  const publicPaths = ['/login', '/portal', '/driver', '/_next', '/favicon'];
  const isPublic = publicPaths.some(p => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // For everything else - check for auth cookie
  const authCookie = request.cookies.get('sams_auth');
  if (!authCookie) {
    // Redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
