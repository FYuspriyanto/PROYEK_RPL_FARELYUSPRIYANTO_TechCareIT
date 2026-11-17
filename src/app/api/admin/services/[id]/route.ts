import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';

const updateServiceSchema = z.object({
  name: z.string().min(3).optional(),
  category: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  priceFrom: z.number().min(0).optional(),
  estimatedDuration: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
});

// PATCH /api/admin/services/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireAdmin().catch(() => null);
  if (!session) return jsonError('Akses ditolak', 403);

  try {
    const body = await req.json();
    const validation = updateServiceSchema.safeParse(body);
    if (!validation.success) {
      return jsonError(validation.error.errors[0]?.message || 'Input tidak valid', 400);
    }

    const service = await prisma.service.update({
      where: { id },
      data: validation.data,
    });

    return jsonSuccess({ service }, 'Layanan berhasil diperbarui');
  } catch (error: any) {
    if (error?.code === 'P2025') return jsonError('Layanan tidak ditemukan', 404);
    return jsonError('Gagal memperbarui layanan', 500);
  }
}
