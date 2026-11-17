import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';
import { invalidateAiConfigCache } from '@/lib/ai/config-loader';

const aiConfigSchema = z.object({
  providerName: z.string().min(2, 'Nama provider minimal 2 karakter'),
  providerSlug: z.string().min(2, 'Slug provider minimal 2 karakter').regex(/^[a-z0-9_-]+$/, 'Slug hanya boleh huruf kecil, angka, strip, atau underscore'),
  apiKey: z.string().min(1, 'API key wajib diisi'),
  model: z.string().min(1, 'Model wajib diisi'),
  baseUrl: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  isPrimary: z.boolean().default(false),
  maxTokens: z.number().int().min(100).max(8192).default(1200),
  temperature: z.number().min(0).max(2).default(0.3),
  timeoutMs: z.number().int().min(5000).max(120000).default(30000),
  notes: z.string().nullable().optional(),
});

// GET /api/admin/ai-config - Get all AI configs
export async function GET(_req: NextRequest) {
  const session = await requireAdmin().catch(() => null);
  if (!session) return jsonError('Akses ditolak', 403);

  try {
    const configs = await prisma.aiConfig.findMany({
      orderBy: [{ isPrimary: 'desc' }, { isActive: 'desc' }, { createdAt: 'asc' }],
    });

    // Mask API key for security in response (e.g., nvapi-***...123)
    const maskedConfigs = configs.map((c) => ({
      ...c,
      maskedApiKey: c.apiKey.length > 8
        ? `${c.apiKey.substring(0, 6)}...${c.apiKey.substring(c.apiKey.length - 4)}`
        : '********',
    }));

    return jsonSuccess({ configs: maskedConfigs });
  } catch (error: any) {
    console.error('Fetch AI configs error:', error);
    return jsonError('Gagal memuat konfigurasi AI', 500);
  }
}

// POST /api/admin/ai-config - Create or add a new provider configuration
export async function POST(req: NextRequest) {
  const session = await requireAdmin().catch(() => null);
  if (!session) return jsonError('Akses ditolak', 403);

  try {
    const body = await req.json();
    const validation = aiConfigSchema.safeParse(body);
    if (!validation.success) {
      return jsonError(validation.error.errors[0]?.message || 'Input tidak valid', 400);
    }

    const data = validation.data;

    // Check if slug already exists
    const existing = await prisma.aiConfig.findUnique({
      where: { providerSlug: data.providerSlug },
    });
    if (existing) {
      return jsonError(`Provider dengan slug "${data.providerSlug}" sudah terdaftar`, 400);
    }

    // If marked as primary, unmark others
    if (data.isPrimary) {
      await prisma.aiConfig.updateMany({
        where: { isPrimary: true },
        data: { isPrimary: false },
      });
      // Primary provider must be active
      data.isActive = true;
    }

    const created = await prisma.aiConfig.create({
      data: {
        providerName: data.providerName,
        providerSlug: data.providerSlug,
        apiKey: data.apiKey,
        model: data.model,
        baseUrl: data.baseUrl || null,
        isActive: data.isActive,
        isPrimary: data.isPrimary,
        maxTokens: data.maxTokens,
        temperature: data.temperature,
        timeoutMs: data.timeoutMs,
        notes: data.notes || null,
      },
    });

    invalidateAiConfigCache();

    return jsonSuccess({ config: created }, 'Konfigurasi provider AI berhasil ditambahkan', 201);
  } catch (error: any) {
    console.error('Create AI config error:', error);
    return jsonError('Gagal menambahkan konfigurasi AI: ' + (error?.message || ''), 500);
  }
}

