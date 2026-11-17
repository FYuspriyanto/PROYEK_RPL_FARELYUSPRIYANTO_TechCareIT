import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import MyOrdersClient from './MyOrdersClient';

export const dynamic = 'force-dynamic';

export default async function MyOrdersPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login?redirect=/customer/orders');
  }

  // Strictly query ONLY this customer's orders
  const orders = await prisma.serviceOrder.findMany({
    where: { customerId: session.id },
    include: {
      service: true,
      technician: true,
      invoice: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return <MyOrdersClient initialOrders={orders as any} />;
}
