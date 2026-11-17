import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AIChatClient from './AIChatClient';

export const dynamic = 'force-dynamic';

export default async function CustomerAIPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login?from=/customer/ai');
  }

  return (
    <AIChatClient
      user={{
        id: session.id,
        name: session.name,
        email: session.email,
        role: session.role,
      }}
    />
  );
}
