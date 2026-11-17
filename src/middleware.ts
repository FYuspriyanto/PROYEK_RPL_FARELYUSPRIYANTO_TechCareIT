import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function getJwtSecret(): Uint8Array {
  const configured = process.env.JWT_SECRET;
  if (!configured) {
    if (IS_PRODUCTION) {
      throw new Error('JWT_SECRET harus diset di environment variable di production.');
    }
    // Development fallback - ganti dengan secret yang lebih kuat
    return new TextEncoder().encode(
      'dev-super-secret-jwt-key-min-32-chars-development-only-do-not-use-in-production'
    );
  }
  return new TextEncoder().encode(configured);
}
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'it_service_session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let session: { id: string; role: 'ADMIN' | 'CUSTOMER'; email: string; name: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
      session = {
        id: payload.id as string,
        role: payload.role as 'ADMIN' | 'CUSTOMER',
        email: payload.email as string,
        name: payload.name as string,
      };
    } catch {
      // Invalid/expired token
      session = null;
    }
  }

  // 1. Admin Routes Protection (/admin/*)
  if (pathname.startsWith('/admin')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.role !== 'ADMIN') {
      // Customer trying to access admin dashboard -> forbidden redirect
      const customerUrl = new URL('/customer/dashboard', request.url);
      customerUrl.searchParams.set('error', 'unauthorized_admin_access');
      return NextResponse.redirect(customerUrl);
    }
  }

  // 2. Customer Routes Protection (/customer/*)
  if (pathname.startsWith('/customer')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Auth Routes (/login, /register) -> redirect if already logged in
  if (pathname === '/login' || pathname === '/register') {
    if (session) {
      const destination = session.role === 'ADMIN' ? '/admin/dashboard' : '/customer/dashboard';
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/customer/:path*', '/login', '/register'],
};
