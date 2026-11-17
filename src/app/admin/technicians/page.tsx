import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminTechniciansClient from './AdminTechniciansClient';

export const dynamic = 'force-dynamic';

export default async function AdminTechniciansPage() {
  const session = await requireAdmin().catch(() => null);
  if (!session) redirect('/login?redirect=/admin/technicians');

  const technicians = await prisma.technician.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          assignedOrders: true,
        },
      },
    },
  });

  return <AdminTechniciansClient technicians={technicians as any} />;
}
