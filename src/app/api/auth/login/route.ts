import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword, setSessionCookie } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password tidak boleh kosong'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || 'Input tidak valid';
      return jsonError(errorMsg, 400);
    }

    const { email, password } = validation.data;

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return jsonError('Email atau password tidak sesuai', 401);
    }

    // Verify password hash
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return jsonError('Email atau password tidak sesuai', 401);
    }

    // Session payload
    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'ADMIN' | 'CUSTOMER',
      phone: user.phone,
    };

    // Set HTTP-Only Cookie
    await setSessionCookie(sessionData);

    // Determine redirect url based on role
    const redirectTo = user.role === 'ADMIN' ? '/admin/dashboard' : '/customer/dashboard';

    return jsonSuccess(
      {
        user: sessionData,
        redirectTo,
      },
      'Login berhasil'
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return jsonError('Terjadi kesalahan pada server saat login', 500);
  }
}
