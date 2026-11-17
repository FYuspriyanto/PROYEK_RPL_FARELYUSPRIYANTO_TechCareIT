import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';

const createTechnicianSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  phone: z.string().min(8, 'Nomor telepon tidak valid'),
  specialization: z.string().min(2, 'Spesialisasi wajib diisi'),
});

// GET /api/admin/technicians — Admin only
export async function GET(_req: NextRequest) {
  const session = await requireAdmin().catch(() => null);
  if (!session) return jsonError('Akses ditolak', 403);

  const technicians = await prisma.technician.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { assignedOrders: true } } },
  });

  return jsonSuccess({ technicians });
}

// POST /api/admin/technicians — Create technician
export async function POST(req: NextRequest) {
  const session = await requireAdmin().catch(() => null);
  if (!session) return jsonError('Akses ditolak', 403);

  try {
    const body = await req.json();
    const validation = createTechnicianSchema.safeParse(body);
    if (!validation.success) {
      return jsonError(validation.error.errors[0]?.message || 'Input tidak valid', 400);
    }

    const technician = await prisma.technician.create({
      data: { ...validation.data, isActive: true },
    });

    return jsonSuccess({ technician }, 'Teknisi berhasil ditambahkan', 201);
  } catch (error: any) {
    console.error('Create technician error:', error);
    return jsonError('Gagal menambahkan teknisi', 500);
  }
}
