import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminOrdersClient from './AdminOrdersClient';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const session = await requireAdmin().catch(() => null);
  if (!session) redirect('/login?redirect=/admin/orders');

  const [orders, technicians] = await Promise.all([
    prisma.serviceOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        service: { select: { id: true, name: true, category: true } },
        technician: { select: { id: true, name: true } },
        invoice: { select: { paymentStatus: true, total: true } },
      },
    }),
    prisma.technician.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ]);

  return <AdminOrdersClient initialOrders={orders as any} technicians={technicians as any} />;
}
