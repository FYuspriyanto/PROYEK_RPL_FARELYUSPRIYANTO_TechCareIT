import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonError, jsonSuccess } from '@/lib/response';

// GET /api/technicians - Get list of technicians
export async function GET(_req: NextRequest) {
  try {
    // Hanya field publik — nomor HP teknisi tidak diekspos ke anonim.
    // (Nomor kontak hanya tampil ke customer yang ordernya ditangani teknisi tsb.)
    const technicians = await prisma.technician.findMany({
      where: { isActive: true },
      select: { id: true, name: true, specialization: true },
      orderBy: { name: 'asc' },
    });

    return jsonSuccess({ technicians });
  } catch (error: any) {
    console.error('Fetch technicians error:', error);
    return jsonError('Gagal memuat daftar teknisi', 500);
  }
}
