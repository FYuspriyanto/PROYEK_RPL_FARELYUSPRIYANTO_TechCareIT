import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import {
  Cpu,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search,
  CheckCircle2,
  Wrench,
  Bot,
  Filter,
} from 'lucide-react';
import ServiceCatalogClient from './ServiceCatalogClient';

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const session = await getSession();

  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <ServiceCatalogClient
      services={services as any}
      isLoggedIn={!!session}
    />
  );
}
