import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';
import { invalidateAiConfigCache } from '@/lib/ai/config-loader';

const updateAiConfigSchema = z.object({
  providerName: z.string().min(2, 'Nama provider minimal 2 karakter').optional(),
  apiKey: z.string().optional(),
  model: z.string().min(1, 'Model wajib diisi').optional(),
  baseUrl: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
  maxTokens: z.number().int().min(100).max(8192).optional(),
  temperature: z.number().min(0).max(2).optional(),
  timeoutMs: z.number().int().min(5000).max(120000).optional(),
  notes: z.string().nullable().optional(),
});

// GET /api/admin/ai-config/[id] - Get single config detail
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin().catch(() => null);
  if (!session) return jsonError('Akses ditolak', 403);

  const { id } = await params;
  const config = await prisma.aiConfig.findUnique({ where: { id } });
  if (!config) return jsonError('Konfigurasi tidak ditemukan', 404);

  return jsonSuccess({
    config: {
      ...config,
      maskedApiKey: config.apiKey.length > 8
        ? `${config.apiKey.substring(0, 6)}...${config.apiKey.substring(config.apiKey.length - 4)}`
        : '********',
    },
  });
}

// PUT /api/admin/ai-config/[id] - Update config
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin().catch(() => null);
  if (!session) return jsonError('Akses ditolak', 403);

  const { id } = await params;
  try {
    const existing = await prisma.aiConfig.findUnique({ where: { id } });
    if (!existing) return jsonError('Konfigurasi tidak ditemukan', 404);

    const body = await req.json();
    const validation = updateAiConfigSchema.safeParse(body);
    if (!validation.success) {
      return jsonError(validation.error.errors[0]?.message || 'Input tidak valid', 400);
    }

    const data = validation.data;
    const updatePayload: Record<string, any> = {};

    if (data.providerName !== undefined) updatePayload.providerName = data.providerName;
    if (data.model !== undefined) updatePayload.model = data.model;
    if (data.baseUrl !== undefined) updatePayload.baseUrl = data.baseUrl;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
    if (data.maxTokens !== undefined) updatePayload.maxTokens = data.maxTokens;
    if (data.temperature !== undefined) updatePayload.temperature = data.temperature;
    if (data.timeoutMs !== undefined) updatePayload.timeoutMs = data.timeoutMs;
    if (data.notes !== undefined) updatePayload.notes = data.notes;

    // Only update apiKey if not empty and not masked placeholder
    if (data.apiKey && data.apiKey.trim() !== '' && !data.apiKey.includes('...')) {
      updatePayload.apiKey = data.apiKey.trim();
    }

    // Handle primary provider switch
    if (data.isPrimary === true) {
      await prisma.aiConfig.updateMany({
        where: { isPrimary: true, id: { not: id } },
        data: { isPrimary: false },
      });
      updatePayload.isPrimary = true;
      updatePayload.isActive = true; // Primary must be active
    } else if (data.isPrimary === false) {
      updatePayload.isPrimary = false;
    }

    const updated = await prisma.aiConfig.update({
      where: { id },
      data: updatePayload,
    });

    invalidateAiConfigCache();

    return jsonSuccess({ config: updated }, 'Konfigurasi provider AI berhasil diperbarui');
  } catch (error: any) {
    console.error('Update AI config error:', error);
    return jsonError('Gagal memperbarui konfigurasi AI: ' + (error?.message || ''), 500);
  }
}

// DELETE /api/admin/ai-config/[id] - Delete a custom provider
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin().catch(() => null);
  if (!session) return jsonError('Akses ditolak', 403);

  const { id } = await params;
  try {
    const existing = await prisma.aiConfig.findUnique({ where: { id } });
    if (!existing) return jsonError('Konfigurasi tidak ditemukan', 404);

    if (existing.isPrimary) {
      return jsonError('Tidak dapat menghapus provider yang saat ini menjadi Primary. Harap pilih provider primary lain terlebih dahulu.', 400);
    }

    await prisma.aiConfig.delete({ where: { id } });
    invalidateAiConfigCache();

    return jsonSuccess(null, `Provider ${existing.providerName} berhasil dihapus`);
  } catch (error: any) {
    console.error('Delete AI config error:', error);
    return jsonError('Gagal menghapus konfigurasi AI', 500);
  }
}

