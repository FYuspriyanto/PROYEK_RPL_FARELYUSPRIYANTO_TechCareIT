import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonError, jsonSuccess } from '@/lib/response';

// GET /api/services - Get active services
export async function GET(_req: NextRequest) {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    return jsonSuccess({ services });
  } catch (error: any) {
    console.error('Fetch services error:', error);
    return jsonError('Gagal memuat daftar layanan', 500);
  }
}
