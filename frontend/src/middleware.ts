import { type NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'accessToken';
const HOME = '/h';
const SIGNIN = '/auth/signin';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthenticated = req.cookies.has(AUTH_COOKIE);

  const isAuthPath = pathname === SIGNIN;
  const isHomePath = pathname === HOME;

  if (isAuthenticated && !isHomePath)
    return NextResponse.redirect(new URL(HOME, req.url));

  if (!isAuthenticated && !isAuthPath)
    return NextResponse.redirect(new URL(SIGNIN, req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|assets/).*)'],
};
