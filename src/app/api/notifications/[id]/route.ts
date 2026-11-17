import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';

// PATCH /api/notifications/[id] — Mark single notification as read
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return jsonError('Tidak terautentikasi', 401);

  const { id } = await params;

  const result = await prisma.notification.updateMany({
    where: { id, userId: session.id },
    data: { isRead: true },
  });

  if (result.count === 0) {
    return jsonError('Notifikasi tidak ditemukan', 404);
  }

  return jsonSuccess({ id }, 'Notifikasi ditandai sudah dibaca');
}

// DELETE /api/notifications/[id] — Delete a notification
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return jsonError('Tidak terautentikasi', 401);

  const { id } = await params;

  const result = await prisma.notification.deleteMany({
    where: { id, userId: session.id },
  });

  if (result.count === 0) {
    return jsonError('Notifikasi tidak ditemukan', 404);
  }

  return jsonSuccess({ id }, 'Notifikasi dihapus');
}
