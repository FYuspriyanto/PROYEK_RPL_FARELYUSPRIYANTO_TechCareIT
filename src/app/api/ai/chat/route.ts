import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';
import { aiAssistantService } from '@/lib/ai/service';
import { ChatMessage } from '@/lib/ai/types';

const chatSchema = z.object({
  message: z.string().min(1, 'Pesan tidak boleh kosong').max(2000, 'Pesan terlalu panjang (maks 2000 karakter)'),
  sessionId: z.string().min(1).optional(),
});

function sanitizeMessage(message: string): string {
  // Strip HTML tags to prevent XSS and prompt injection
  const sanitized = message.replace(/<(script|javascript|iframe|meta|link|style|svg|body|html)([^>])*>/gi, '').trim();

  // Check for common prompt injection patterns
  const suspiciousPatterns = [
    /system\s*:/gi,
    /prompt\s*:/gi,
    /instructions\s*:/gi,
    /ignore\s+previous\s+system/gi,
    /override/gi,
    /copy\s+this/gi,
    /ignore.*previous/gi,
    /forget.*all/gi,
    /new\s+system/gi,
  ];
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      // Return sanitized version that removes the suspicious part
      return sanitized.replace(pattern, '[pola terdeteksi dan dibersihkan]');
    }
  }
  return sanitized;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Get session (optional for guest mode)
    const session = await getSession();
    const userId = session?.id;
    const userRole = session?.role || 'GUEST';

    // 2. Validate body
    const body = await req.json().catch(() => null);
    if (!body) {
      return jsonError('Invalid JSON request body', 400);
    }

    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message || 'Input tidak valid', 422);
    }

    const { message, sessionId: inputSessionId } = parsed.data;
    const sessionId = inputSessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 3. Security: Sanitize message to prevent prompt injection
    const sanitizedMessage = sanitizeMessage(message);

    // 4. Find or create AI Conversation
    let conversation = await prisma.aiConversation.findUnique({
      where: { sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 12,
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.aiConversation.create({
        data: {
          sessionId,
          userId: userId || null, // null for guest users
          title: sanitizedMessage.slice(0, 50),
        },
        include: {
          messages: true,
        },
      });
    } else if (conversation.userId && conversation.userId !== userId && userRole !== 'ADMIN') {
      // Cegah user menempelkan pesan ke conversation milik user lain (IDOR)
      return jsonError('Forbidden: Anda tidak memiliki akses ke percakapan ini', 403);
    } else if (!conversation.userId && userId) {
      // Klaim conversation yatim ke user saat ini agar terlindungi ke depannya
      conversation = await prisma.aiConversation.update({
        where: { id: conversation.id },
        data: { userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 12,
          },
        },
      });
    }

    // 5. Save User message to DB (save original message, not sanitized)
    const userMsgRecord = await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    });

    // 6. Build recent chat history
    const history: ChatMessage[] = (conversation.messages || []).map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    // 7. Process message through AI Service (use sanitized message + userId for DB context)
    // Pass userId (can be undefined for guest mode)
    const aiResponse = await aiAssistantService.processChat(history, sanitizedMessage, userId);

    // 8. Save Assistant response to DB with metadata
    const assistantMsgRecord = await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse.content,
        metadata: JSON.stringify({
          recommendedServices: aiResponse.recommendedServices,
          suggestedPrompts: aiResponse.suggestedPrompts,
          providerUsed: aiResponse.providerUsed,
          serviceRequestProposal: aiResponse.serviceRequestProposal,
        }),
      },
    });

    return jsonSuccess({
      sessionId,
      conversationId: conversation.id,
      userMessage: {
        id: userMsgRecord.id,
        role: 'user',
        content: userMsgRecord.content,
        createdAt: userMsgRecord.createdAt,
      },
      assistantMessage: {
        id: assistantMsgRecord.id,
        role: 'assistant',
        content: assistantMsgRecord.content,
        createdAt: assistantMsgRecord.createdAt,
      },
      recommendedServices: aiResponse.recommendedServices,
      suggestedPrompts: aiResponse.suggestedPrompts,
      providerUsed: aiResponse.providerUsed,
      serviceRequestProposal: aiResponse.serviceRequestProposal,
      requiresAuth: !userId && requiresPersonalData(message), // Tell frontend if auth needed
    });
  } catch (error: any) {
    console.error('[AI Chat API Error]:', error);
    return jsonError('Terjadi kesalahan internal pada server AI Assistant', 500);
  }
}

/**
 * Check if a message likely requires personal data access
 * Used to prompt guest users to login for personalized responses
 */
function requiresPersonalData(message: string): boolean {
  const personalKeywords = [
    'pesanan saya', 'order saya', 'status pesanan', 'tagihan saya', 'invoice saya',
    'profil saya', 'akun saya', 'data saya', 'riwayat saya', 'notifikasi saya',
    'bayar saya', 'pembayaran saya', 'biaya saya', 'teknisi saya', 'layanan saya',
    'progres servis', 'kapan selesai', 'siap diambil', 'status servis'
  ];
  
  const lowerMessage = message.toLowerCase();
  return personalKeywords.some(keyword => lowerMessage.includes(keyword));
}