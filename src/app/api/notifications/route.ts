import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';

// GET /api/notifications — Get notifications for current user
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError('Tidak terautentikasi', 401);

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get('unread') === 'true';
  const take = parseInt(searchParams.get('take') || '30', 10);

  const whereClause: any = { userId: session.id };
  if (unreadOnly) whereClause.isRead = false;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: Math.min(take, 100),
    }),
    prisma.notification.count({
      where: { userId: session.id, isRead: false },
    }),
  ]);

  return jsonSuccess({ notifications, unreadCount });
}

// PATCH /api/notifications — Mark all as read
export async function PATCH(_req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError('Tidak terautentikasi', 401);

  const result = await prisma.notification.updateMany({
    where: { userId: session.id, isRead: false },
    data: { isRead: true },
  });

  return jsonSuccess({ updated: result.count }, `${result.count} notifikasi ditandai sudah dibaca`);
}
