import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminAiConfigClient from './AdminAiConfigClient';

export const dynamic = 'force-dynamic';

export default async function AdminAiConfigPage() {
  await requireAdmin();

  const configs = await prisma.aiConfig.findMany({
    orderBy: [{ isPrimary: 'desc' }, { isActive: 'desc' }, { createdAt: 'asc' }],
  });

  const serialized = configs.map((c) => ({
    id: c.id,
    providerName: c.providerName,
    providerSlug: c.providerSlug,
    apiKey: c.apiKey,
    maskedApiKey: c.apiKey.length > 8
      ? `${c.apiKey.substring(0, 6)}...${c.apiKey.substring(c.apiKey.length - 4)}`
      : '********',
    model: c.model,
    baseUrl: c.baseUrl,
    isActive: c.isActive,
    isPrimary: c.isPrimary,
    maxTokens: c.maxTokens,
    temperature: c.temperature,
    timeoutMs: c.timeoutMs,
    notes: c.notes,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return <AdminAiConfigClient initialConfigs={serialized} />;
}

