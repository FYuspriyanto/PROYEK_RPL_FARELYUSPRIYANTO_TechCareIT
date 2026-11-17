import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import Link from 'next/link';
import {
  Bell,
  Package,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
  CheckCheck,
  Zap,
  Trash2,
} from 'lucide-react';
import NotificationsClient from './NotificationsClient';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login?redirect=/customer/notifications');
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <Bell size={24} color="var(--accent-cyan)" />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Pusat Notifikasi</h1>
          {unreadCount > 0 && (
            <span className="badge badge-amber">{unreadCount} belum dibaca</span>
          )}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Update terkini status servis, estimasi biaya, dan informasi pengambilan perangkat Anda
        </p>
      </div>

      <NotificationsClient initialNotifications={notifications.map(n => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      }))} />
    </div>
  );
}
