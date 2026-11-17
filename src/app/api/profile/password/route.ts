import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini wajib diisi').max(72),
  newPassword: z.string().min(8, 'Password baru minimal 8 karakter').max(72),
});

// PATCH /api/profile/password
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError('Tidak terautentikasi', 401);
    }

    const body = await req.json();
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      return jsonError(validation.error.errors[0]?.message || 'Input tidak valid', 400);
    }

    const { currentPassword, newPassword } = validation.data;

    // Fetch user with password hash
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) {
      return jsonError('Pengguna tidak ditemukan', 404);
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return jsonError('Password saat ini tidak benar', 400);
    }

    // Hash and save new password
    const hashedNew = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.id },
      data: { password: hashedNew },
    });

    return jsonSuccess({}, 'Password berhasil diperbarui');
  } catch (error: any) {
    console.error('Change password error:', error);
    return jsonError('Gagal memperbarui password', 500);
  }
}
