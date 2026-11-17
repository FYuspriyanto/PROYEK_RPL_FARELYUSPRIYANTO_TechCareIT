import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminCustomersClient from './AdminCustomersClient';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  const session = await requireAdmin().catch(() => null);
  if (!session) redirect('/login?redirect=/admin/customers');

  // Proyeksikan field eksplisit — JANGAN kirim password hash ke browser.
  // (Objek yang diteruskan ke Client Component akan diserialisasi ke HTML.)
  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      profile: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return <AdminCustomersClient customers={customers as any} />;
}
