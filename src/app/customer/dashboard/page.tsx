import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import CustomerDashboardMain from './CustomerDashboardMain';

export const dynamic = 'force-dynamic';

export default async function CustomerDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login?redirect=/customer/dashboard');
  }

  // Fetch full user with profile
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      profile: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  // Fetch all orders of this customer
  const orders = await prisma.serviceOrder.findMany({
    where: { customerId: user.id },
    include: {
      service: true,
      technician: true,
      invoice: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate 4 KPI metrics:
  // 1. Active Services (REQUESTED, DIAGNOSING, WAITING_APPROVAL, IN_PROGRESS)
  // 2. Pending Payment (Invoice UNPAID or status READY)
  // 3. Completed Services (COMPLETED)
  // 4. Total Services (all orders)
  const activeServicesCount = orders.filter((o) =>
    ['REQUESTED', 'DIAGNOSING', 'WAITING_APPROVAL', 'IN_PROGRESS', 'READY'].includes(o.status)
  ).length;

  const pendingPaymentCount = orders.filter(
    (o) => o.invoice?.paymentStatus === 'UNPAID' && o.status !== 'CANCELLED'
  ).length;

  const completedServicesCount = orders.filter((o) => o.status === 'COMPLETED').length;
  const totalServicesCount = orders.length;

  // Available services for quick recommendations
  const recommendedServices = await prisma.service.findMany({
    where: { isActive: true },
    take: 3,
  });

  return (
    <CustomerDashboardMain
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.profile?.address || null,
      }}
      metrics={{
        activeServices: activeServicesCount,
        pendingPayment: pendingPaymentCount,
        completedServices: completedServicesCount,
        totalServices: totalServicesCount,
      }}
      recentOrders={orders as any}
      recommendedServices={recommendedServices as any}
    />
  );
}
