import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';

const updateKbSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(200).optional(),
  content: z.string().min(10, 'Konten minimal 10 karakter').optional(),
  category: z.string().min(2, 'Kategori wajib diisi').optional(),
  isPublished: z.boolean().optional(),
});

// GET /api/admin/knowledge-base/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return jsonError('Unauthorized: Akses admin dibutuhkan', 401);
    }

    const { id } = await params;
    const article = await prisma.knowledgeBase.findUnique({
      where: { id },
    });

    if (!article) {
      return jsonError('Artikel tidak ditemukan', 404);
    }

    return jsonSuccess({ article });
  } catch (error: any) {
    console.error('[Admin KB Item GET Error]:', error);
    return jsonError('Gagal memuat artikel', 500);
  }
}

// PATCH /api/admin/knowledge-base/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return jsonError('Unauthorized: Akses admin dibutuhkan', 401);
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) {
      return jsonError('Invalid request body', 400);
    }

    const parsed = updateKbSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message || 'Input tidak valid', 422);
    }

    const existing = await prisma.knowledgeBase.findUnique({ where: { id } });
    if (!existing) {
      return jsonError('Artikel tidak ditemukan', 404);
    }

    const updated = await prisma.knowledgeBase.update({
      where: { id },
      data: parsed.data,
    });

    return jsonSuccess({ article: updated, message: 'Artikel berhasil diperbarui' });
  } catch (error: any) {
    console.error('[Admin KB Item PATCH Error]:', error);
    return jsonError('Gagal memperbarui artikel', 500);
  }
}

// DELETE /api/admin/knowledge-base/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return jsonError('Unauthorized: Akses admin dibutuhkan', 401);
    }

    const { id } = await params;
    const existing = await prisma.knowledgeBase.findUnique({ where: { id } });
    if (!existing) {
      return jsonError('Artikel tidak ditemukan', 404);
    }

    await prisma.knowledgeBase.delete({ where: { id } });

    return jsonSuccess({ message: 'Artikel berhasil dihapus' });
  } catch (error: any) {
    console.error('[Admin KB Item DELETE Error]:', error);
    return jsonError('Gagal menghapus artikel', 500);
  }
}
