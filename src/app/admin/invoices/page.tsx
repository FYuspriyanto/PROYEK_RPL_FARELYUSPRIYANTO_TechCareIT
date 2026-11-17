import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminInvoicesClient from './AdminInvoicesClient';

export const dynamic = 'force-dynamic';

export default async function AdminInvoicesPage() {
  const session = await requireAdmin().catch(() => null);
  if (!session) redirect('/login?redirect=/admin/invoices');

  // All orders (including those without invoice — for "Create Invoice" action)
  const [invoices, ordersWithoutInvoice] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          include: {
            customer: { select: { id: true, name: true, email: true } },
            service: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.serviceOrder.findMany({
      where: { invoice: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        deviceBrand: true,
        deviceModel: true,
        estimatedCost: true,
        customer: { select: { name: true } },
        service: { select: { name: true, priceFrom: true } },
      },
    }),
  ]);

  return (
    <AdminInvoicesClient
      invoices={invoices as any}
      ordersWithoutInvoice={ordersWithoutInvoice as any}
    />
  );
}
