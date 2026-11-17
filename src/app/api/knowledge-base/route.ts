import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonError, jsonSuccess } from '@/lib/response';

// GET /api/knowledge-base - Get published KB articles
export async function GET(_req: NextRequest) {
  try {
    const articles = await prisma.knowledgeBase.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });

    return jsonSuccess({ articles });
  } catch (error: any) {
    console.error('Fetch KB articles error:', error);
    return jsonError('Gagal memuat artikel knowledge base', 500);
  }
}
