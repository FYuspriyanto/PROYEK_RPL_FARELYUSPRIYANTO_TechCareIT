import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';
import { DynamicProvider } from '@/lib/ai/providers/dynamic';

const testConnectionSchema = z.object({
  providerSlug: z.string().min(1),
  providerName: z.string().min(1),
  apiKey: z.string().min(1, 'API key wajib diisi untuk tes koneksi'),
  model: z.string().min(1, 'Model wajib diisi'),
  baseUrl: z.string().nullable().optional(),
  temperature: z.number().min(0).max(2).default(0.3),
  maxTokens: z.number().int().default(100),
  timeoutMs: z.number().int().default(15000),
});

// POST /api/admin/ai-config/test - Test connection to provider API
export async function POST(req: NextRequest) {
  const session = await requireAdmin().catch(() => null);
  if (!session) return jsonError('Akses ditolak', 403);

  try {
    const body = await req.json();
    const validation = testConnectionSchema.safeParse(body);
    if (!validation.success) {
      return jsonError(validation.error.errors[0]?.message || 'Input tidak valid', 400);
    }

    const data = validation.data;
    const provider = new DynamicProvider({
      providerSlug: data.providerSlug,
      providerName: data.providerName,
      apiKey: data.apiKey,
      model: data.model,
      baseUrl: data.baseUrl,
      temperature: data.temperature,
      maxTokens: data.maxTokens,
      timeoutMs: data.timeoutMs,
    });

    const startTime = Date.now();
    const testPrompt = 'Jawab hanya dengan 1 kata: "OK"';
    const testResponse = await provider.generateResponse(
      'Anda adalah AI asisten untuk verifikasi koneksi sistem.',
      [],
      testPrompt
    );
    const durationMs = Date.now() - startTime;

    return jsonSuccess({
      success: true,
      durationMs,
      response: testResponse,
      message: `Koneksi ke ${data.providerName} (${data.model}) BERHASIL! [Respon: "${testResponse}", Waktu: ${durationMs}ms]`,
    });
  } catch (error: any) {
    console.error('Test AI provider error:', error);
    return jsonError(
      `Tes koneksi gagal: ${error?.message || 'Tidak dapat terhubung ke endpoint provider'}`,
      400
    );
  }
}

