import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await requireAdmin().catch(() => null);
  if (!session) redirect('/login?redirect=/admin/dashboard');

  const [totalCustomers, allOrders, invoices, recentOrders, technicians] = await Promise.all([
    // 1. Total customers
    prisma.user.count({ where: { role: 'CUSTOMER' } }),

    // 2. All orders for metrics
    prisma.serviceOrder.findMany({
      select: { status: true, finalCost: true, estimatedCost: true, createdAt: true },
    }),

    // 3. All invoices for revenue & pending
    prisma.invoice.findMany({
      select: { paymentStatus: true, total: true },
    }),

    // 4. Recent orders for table
    prisma.serviceOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        customer: { select: { name: true, email: true } },
        service: { select: { name: true } },
        technician: { select: { name: true } },
        invoice: { select: { paymentStatus: true, total: true } },
      },
    }),

    // 5. Technician workload
    prisma.technician.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            assignedOrders: {
              where: { status: { in: ['DIAGNOSING', 'IN_PROGRESS', 'WAITING_APPROVAL'] } },
            },
          },
        },
      },
      take: 5,
    }),
  ]);

  const metrics = {
    totalCustomers,
    newRequests: allOrders.filter((o) => o.status === 'REQUESTED').length,
    activeServices: allOrders.filter((o) =>
      ['DIAGNOSING', 'WAITING_APPROVAL', 'IN_PROGRESS'].includes(o.status)
    ).length,
    readyForPickup: allOrders.filter((o) => o.status === 'READY').length,
    completedServices: allOrders.filter((o) => o.status === 'COMPLETED').length,
    totalRevenue: invoices
      .filter((i) => i.paymentStatus === 'PAID')
      .reduce((sum, i) => sum + i.total, 0),
    pendingPayments: invoices.filter((i) => i.paymentStatus === 'UNPAID').length,
    pendingAmount: invoices
      .filter((i) => i.paymentStatus === 'UNPAID')
      .reduce((sum, i) => sum + i.total, 0),
  };

  return (
    <AdminDashboardClient
      metrics={metrics}
      recentOrders={recentOrders as any}
      technicians={technicians as any}
    />
  );
}
