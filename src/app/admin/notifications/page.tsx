import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import NotificationsClient from '@/app/customer/notifications/NotificationsClient';
import { Bell } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminNotificationsPage() {
  const session = await requireAdmin().catch(() => null);

  if (!session) {
    redirect('/login?redirect=/admin/notifications');
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <Bell size={24} color="var(--accent-cyan)" />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Pusat Notifikasi Admin</h1>
          {unreadCount > 0 && (
            <span className="badge badge-amber">{unreadCount} belum dibaca</span>
          )}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Notifikasi service request baru, persetujuan customer, dan update pembayaran
        </p>
      </div>

      <NotificationsClient
        initialNotifications={notifications.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
