import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import ProfileClient from './ProfileClient';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect('/login?redirect=/customer/profile');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { profile: true },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <ProfileClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.profile?.address || null,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      }}
    />
  );
}
