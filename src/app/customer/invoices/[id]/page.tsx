import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import CustomerInvoiceDetailClient from './CustomerInvoiceDetailClient';

export const dynamic = 'force-dynamic';

export default async function CustomerInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?redirect=/customer/invoices/${id}`);

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

  // Authorization: customer can only see their own invoice
  if (session.role === 'CUSTOMER' && invoice.order.customerId !== session.id) {
    redirect('/customer/invoices');
  }

  return <CustomerInvoiceDetailClient invoice={invoice as any} />;
}
