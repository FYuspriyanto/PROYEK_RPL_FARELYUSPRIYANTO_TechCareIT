import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';

const createServiceSchema = z.object({
  name: z.string().min(3, 'Nama layanan minimal 3 karakter'),
  category: z.string().min(2, 'Kategori wajib dipilih'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  priceFrom: z.number().min(0, 'Harga tidak boleh negatif'),
  estimatedDuration: z.string().min(2, 'Estimasi durasi wajib diisi'),
});

// GET /api/admin/services — All services including inactive
export async function GET(_req: NextRequest) {
  const session = await requireAdmin().catch(() => null);
  if (!session) return jsonError('Akses ditolak', 403);

  const services = await prisma.service.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { orders: true } } },
  });

  return jsonSuccess({ services });
}

// POST /api/admin/services — Create service
export async function POST(req: NextRequest) {
  const session = await requireAdmin().catch(() => null);
  if (!session) return jsonError('Akses ditolak', 403);

  try {
    const body = await req.json();
    const validation = createServiceSchema.safeParse(body);
    if (!validation.success) {
      return jsonError(validation.error.errors[0]?.message || 'Input tidak valid', 400);
    }

    const service = await prisma.service.create({
      data: { ...validation.data, isActive: true },
    });

    return jsonSuccess({ service }, 'Layanan berhasil ditambahkan', 201);
  } catch (error: any) {
    console.error('Create service error:', error);
    return jsonError('Gagal menambahkan layanan', 500);
  }
}
