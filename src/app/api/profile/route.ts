import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// GET /api/profile
export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError('Tidak terautentikasi', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { profile: true },
    });

    if (!user) {
      return jsonError('Pengguna tidak ditemukan', 404);
    }

    return jsonSuccess({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.profile?.address || null,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    return jsonError('Gagal memuat profil', 500);
  }
}

// PATCH /api/profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError('Tidak terautentikasi', 401);
    }

    const body = await req.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return jsonError(validation.error.errors[0]?.message || 'Input tidak valid', 400);
    }

    const { name, phone, address } = validation.data;

    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: {
        name,
        phone: phone || null,
        profile: {
          upsert: {
            create: { address: address || null },
            update: { address: address || null },
          },
        },
      },
      include: { profile: true },
    });

    return jsonSuccess(
      {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
          address: updatedUser.profile?.address || null,
        },
      },
      'Profil berhasil diperbarui'
    );
  } catch (error: any) {
    console.error('Update profile error:', error);
    return jsonError('Gagal memperbarui profil', 500);
  }
}
