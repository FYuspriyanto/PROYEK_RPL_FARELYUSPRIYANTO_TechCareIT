import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import AdminInvoiceDetailClient from './AdminInvoiceDetailClient';

export const dynamic = 'force-dynamic';

export default async function AdminInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin().catch(() => null);
  if (!session) redirect('/login?redirect=/admin/invoices');

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          customer: { include: { profile: true } },
          service: true,
          technician: { select: { id: true, name: true, phone: true } },
        },
      },
    },
  });

  if (!invoice) notFound();

  return <AdminInvoiceDetailClient invoice={invoice as any} />;
}
