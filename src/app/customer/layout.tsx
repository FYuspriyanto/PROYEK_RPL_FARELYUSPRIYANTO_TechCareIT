import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import CustomerPortalLayoutClient from './CustomerPortalLayoutClient';

export const dynamic = 'force-dynamic';

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login?redirect=/customer/dashboard');
  }

  // Get active user info & notification counts
  const [user, unreadCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      include: {
        profile: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    }),
    prisma.notification.count({
      where: { userId: session.id, isRead: false },
    }),
  ]);

  if (!user) {
    redirect('/login');
  }

  return (
    <CustomerPortalLayoutClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.profile?.address || null,
        orderCount: user._count.orders,
      }}
      unreadNotifications={unreadCount}
    >
      {children}
    </CustomerPortalLayoutClient>
  );
}

