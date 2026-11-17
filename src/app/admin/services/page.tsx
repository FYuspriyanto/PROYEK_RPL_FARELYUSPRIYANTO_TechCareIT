import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminServicesClient from './AdminServicesClient';

export const dynamic = 'force-dynamic';

export default async function AdminServicesPage() {
  const session = await requireAdmin().catch(() => null);
  if (!session) redirect('/login?redirect=/admin/services');

  const services = await prisma.service.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { orders: true } },
    },
  });

  return <AdminServicesClient services={services as any} />;
}
