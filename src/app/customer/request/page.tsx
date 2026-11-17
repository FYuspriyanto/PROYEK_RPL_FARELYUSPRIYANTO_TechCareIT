import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import ServiceRequestClient from './ServiceRequestClient';

export const dynamic = 'force-dynamic';

export default async function ServiceRequestPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login?redirect=/customer/request');
  }

  // Fetch customer profile
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { profile: true },
  });

  if (!user) {
    redirect('/login');
  }

  // Fetch all active services
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { category: 'asc' },
  });

  return (
    <ServiceRequestClient
      user={{
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.profile?.address || '',
      }}
      services={services as any}
    />
  );
}
