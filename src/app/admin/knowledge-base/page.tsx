import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminKnowledgeBaseClient from './AdminKnowledgeBaseClient';

export const dynamic = 'force-dynamic';

export default async function AdminKnowledgeBasePage() {
  await requireAdmin();

  const articles = await prisma.knowledgeBase.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <AdminKnowledgeBaseClient
      initialArticles={articles.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        category: a.category,
        isPublished: a.isPublished,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      }))}
    />
  );
}
