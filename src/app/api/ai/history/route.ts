import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';

// GET /api/ai/history?sessionId=...
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError('Unauthorized: Silakan login terlebih dahulu', 401);
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      // Find latest conversation for this user if no sessionId specified
      const latestConv = await prisma.aiConversation.findFirst({
        where: { userId: session.id },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!latestConv) {
        return jsonSuccess({ conversation: null, messages: [] });
      }

      const formatted = latestConv.messages.map((m) => {
        let meta = null;
        if (m.metadata) {
          try {
            meta = JSON.parse(m.metadata);
          } catch {}
        }
        return {
          id: m.id,
          role: m.role,
          content: m.content,
          metadata: meta,
          createdAt: m.createdAt,
        };
      });

      return jsonSuccess({
        sessionId: latestConv.sessionId,
        conversationId: latestConv.id,
        messages: formatted,
      });
    }

    const conversation = await prisma.aiConversation.findUnique({
      where: { sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return jsonSuccess({ conversation: null, messages: [] });
    }

    // Security check: ensure conversation belongs to current user or user is admin
    if (conversation.userId && conversation.userId !== session.id && session.role !== 'ADMIN') {
      return jsonError('Forbidden: Anda tidak memiliki akses ke percakapan ini', 403);
    }

    const formatted = conversation.messages.map((m) => {
      let meta = null;
      if (m.metadata) {
        try {
          meta = JSON.parse(m.metadata);
        } catch {}
      }
      return {
        id: m.id,
        role: m.role,
        content: m.content,
        metadata: meta,
        createdAt: m.createdAt,
      };
    });

    return jsonSuccess({
      sessionId: conversation.sessionId,
      conversationId: conversation.id,
      messages: formatted,
    });
  } catch (error: any) {
    console.error('[AI History GET Error]:', error);
    return jsonError('Gagal memuat riwayat percakapan', 500);
  }
}

// DELETE /api/ai/history?sessionId=... (Clear current conversation)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError('Unauthorized: Silakan login terlebih dahulu', 401);
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return jsonError('sessionId parameter wajib disertakan', 400);
    }

    const conversation = await prisma.aiConversation.findUnique({
      where: { sessionId },
    });

    if (!conversation) {
      return jsonSuccess({ message: 'Percakapan sudah dihapus atau tidak ditemukan' });
    }

    if (conversation.userId && conversation.userId !== session.id && session.role !== 'ADMIN') {
      return jsonError('Forbidden: Akses ditolak', 403);
    }

    await prisma.aiConversation.delete({
      where: { id: conversation.id },
    });

    return jsonSuccess({ message: 'Riwayat percakapan berhasil dihapus' });
  } catch (error: any) {
    console.error('[AI History DELETE Error]:', error);
    return jsonError('Gagal menghapus riwayat percakapan', 500);
  }
}
