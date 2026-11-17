import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import AdminOrderDetailClient from './AdminOrderDetailClient';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin().catch(() => null);
  if (!session) redirect('/login?redirect=/admin/orders');

  const [order, technicians] = await Promise.all([
    prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        customer: { include: { profile: true } },
        service: true,
        technician: true,
        invoice: true,
      },
    }),
    prisma.technician.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ]);

  if (!order) notFound();

  return <AdminOrderDetailClient order={order as any} technicians={technicians as any} />;
}
