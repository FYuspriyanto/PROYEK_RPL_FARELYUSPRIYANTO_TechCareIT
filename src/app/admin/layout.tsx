import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminLayoutClient from './AdminLayoutClient';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin().catch(() => null);

  if (!session) {
    redirect('/login?redirect=/admin/dashboard');
  }

  const unreadCount = await prisma.notification.count({
    where: { userId: session.id, isRead: false },
  });

  return (
    <AdminLayoutClient
      user={{ name: session.name, email: session.email, role: session.role }}
      unreadNotifications={unreadCount}
    >
      {children}
    </AdminLayoutClient>
  );
}
