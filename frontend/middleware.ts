import { ROUTES } from '@app/shared/navigation';
import { type NextRequest, NextResponse } from 'next/server';

// Name of the cookie that holds the auth token
const AUTH_COOKIE = 'accessToken';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthenticated = req.cookies.has(AUTH_COOKIE);
  const isAuthPath = pathname.startsWith(ROUTES.auth);

  // Authenticated user hitting auth pages → go home
  if (isAuthenticated && isAuthPath) {
    return NextResponse.redirect(new URL(ROUTES.home, req.url));
  }

  // Unauthenticated user hitting protected pages → go to signin
  if (!isAuthenticated && !isAuthPath) {
    return NextResponse.redirect(new URL(ROUTES.signin, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Все маршруты кроме _next и статики с расширениями
    '/((?!_next/static|_next/image|favicon.ico)(?!.*\\.[a-zA-Z0-9]+$).*)',
    '/',
  ],
};
