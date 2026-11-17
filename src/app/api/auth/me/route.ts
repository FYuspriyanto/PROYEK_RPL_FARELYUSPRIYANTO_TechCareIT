import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonError, jsonSuccess } from '@/lib/response';

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError('Tidak terautentikasi', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        profile: {
          select: {
            address: true,
          },
        },
      },
    });

    if (!user) {
      return jsonError('User tidak ditemukan', 404);
    }

    return jsonSuccess({ user });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return jsonError('Gagal memuat profil pengguna', 500);
  }
}
