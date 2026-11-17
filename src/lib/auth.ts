import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { env } from './env';
import { UserSession } from '@/types';

const COOKIE_NAME = env.SESSION_COOKIE_NAME;

// Ambil JWT secret secara lazy. Di production, aplikasi MENOLAK berjalan
// dengan secret default agar sesi tidak bisa dipalsukan.
function getSecretKey(): Uint8Array {
  const configured = process.env.JWT_SECRET;
  if (!configured && env.isProduction) {
    throw new Error('JWT_SECRET harus diset. Set environment variable JWT_SECRET di production.');
  }
  if (!configured) {
    return new TextEncoder().encode(
      'dev-super-secret-jwt-key-min-32-chars-development-only-do-not-use-in-production'
    );
  }
  return new TextEncoder().encode(configured);
}

// Hash password using bcryptjs
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Sign JWT Token
export async function createToken(payload: UserSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());
}

// Verify JWT Token
export async function verifyToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as 'ADMIN' | 'CUSTOMER',
      phone: (payload.phone as string) || null,
    };
  } catch (err) {
    return null;
  }
}

// Set session cookie in server context
export async function setSessionCookie(session: UserSession): Promise<void> {
  const token = await createToken(session);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

// Get session from server cookie or optional request object
export async function getSession(req?: any): Promise<UserSession | null> {
  try {
    let token: string | undefined;
    if (req) {
      if (typeof req.cookies?.get === 'function') {
        token = req.cookies.get(COOKIE_NAME)?.value;
      }
      if (!token && typeof req.headers?.get === 'function') {
        const cookieHeader = req.headers.get('cookie') || '';
        const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
        if (match) token = match[1];
      }
    }
    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get(COOKIE_NAME)?.value;
      } catch {}
    }
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

// Clear session cookie
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Require authenticated user (throws or returns session)
export async function requireAuth(allowedRoles?: ('ADMIN' | 'CUSTOMER')[]): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new Error('FORBIDDEN');
  }
  return session;
}

// Require Admin role
export async function requireAdmin(): Promise<UserSession> {
  return requireAuth(['ADMIN']);
}

// Require Customer role
export async function requireCustomer(): Promise<UserSession> {
  return requireAuth(['CUSTOMER']);
}

