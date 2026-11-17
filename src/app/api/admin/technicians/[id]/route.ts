import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';

const updateTechnicianSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  specialization: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
});

// PATCH /api/admin/technicians/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireAdmin().catch(() => null);
  if (!session) return jsonError('Akses ditolak', 403);

  try {
    const body = await req.json();
    const validation = updateTechnicianSchema.safeParse(body);
    if (!validation.success) {
      return jsonError(validation.error.errors[0]?.message || 'Input tidak valid', 400);
    }

    const technician = await prisma.technician.update({
      where: { id },
      data: validation.data,
    });

    return jsonSuccess({ technician }, 'Teknisi berhasil diperbarui');
  } catch (error: any) {
    if (error?.code === 'P2025') return jsonError('Teknisi tidak ditemukan', 404);
    return jsonError('Gagal memperbarui teknisi', 500);
  }
}

// DELETE /api/admin/technicians/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireAdmin().catch(() => null);
  if (!session) return jsonError('Akses ditolak', 403);

  try {
    await prisma.technician.delete({ where: { id } });
    return jsonSuccess({}, 'Teknisi berhasil dihapus');
  } catch (error: any) {
    if (error?.code === 'P2025') return jsonError('Teknisi tidak ditemukan', 404);
    return jsonError('Gagal menghapus teknisi', 500);
  }
}
