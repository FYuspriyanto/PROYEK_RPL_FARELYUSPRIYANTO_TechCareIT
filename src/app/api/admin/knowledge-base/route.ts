import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';

const kbSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(200, 'Judul maksimal 200 karakter'),
  content: z.string().min(10, 'Konten minimal 10 karakter'),
  category: z.string().min(2, 'Kategori wajib diisi'),
  isPublished: z.boolean().default(true),
});

// GET /api/admin/knowledge-base - Get all KB articles (Admin only)
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return jsonError('Unauthorized: Akses admin dibutuhkan', 401);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }
    if (category) {
      where.category = category;
    }

    const articles = await prisma.knowledgeBase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return jsonSuccess({ articles });
  } catch (error: any) {
    console.error('[Admin KB GET Error]:', error);
    return jsonError('Gagal memuat artikel knowledge base', 500);
  }
}

// POST /api/admin/knowledge-base - Create new KB article (Admin only)
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return jsonError('Unauthorized: Akses admin dibutuhkan', 401);
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return jsonError('Invalid request body', 400);
    }

    const parsed = kbSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message || 'Input tidak valid', 422);
    }

    const article = await prisma.knowledgeBase.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        category: parsed.data.category,
        isPublished: parsed.data.isPublished,
      },
    });

    return jsonSuccess({ article }, 'Artikel Knowledge Base berhasil dibuat', 201);
  } catch (error: any) {
    console.error('[Admin KB POST Error]:', error);
    return jsonError('Gagal membuat artikel knowledge base', 500);
  }
}
