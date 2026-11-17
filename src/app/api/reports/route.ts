import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';
import { notifyUserReport } from '@/lib/notifications/whatsapp';
import { notifyUserReportTelegram } from '@/lib/notifications/telegram';

const reportSchema = z.object({
  subject: z.string().min(5, 'Subjek minimal 5 karakter').max(200),
  message: z.string().min(10, 'Pesan minimal 10 karakter').max(5000),
  category: z.enum(['COMPLAINT', 'INQUIRY', 'FEEDBACK', 'TECHNICAL_ISSUE', 'BILLING', 'OTHER']).optional(),
});

// POST /api/reports - Customer submit laporan/keluhan
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError('Tidak terautentikasi. Silakan login terlebih dahulu.', 401);
    }

    const body = await req.json();
    const validation = reportSchema.safeParse(body);

    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || 'Input tidak valid';
      return jsonError(errorMsg, 400);
    }

    const { subject, message, category } = validation.data;

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { name: true, email: true, phone: true },
    });

    if (!user) {
      return jsonError('User tidak ditemukan', 404);
    }

    // TODO: Optionally save report to database (create Report model in Prisma if needed)
    // For now, just send WhatsApp notification to admin

    // Send WhatsApp notification to admin (non-blocking)
    try {
      await notifyUserReport({
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone || undefined,
        subject,
        message,
      });
    } catch (whatsappError) {
      console.error('[Report] WhatsApp notification failed:', whatsappError);
      // Don't fail the request if WhatsApp fails
    }

    // Send Telegram notification to admin (non-blocking)
    try {
      await notifyUserReportTelegram({
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone || undefined,
        subject,
        message,
      });
    } catch (telegramError) {
      console.error('[Report] Telegram notification failed:', telegramError);
      // Don't fail the request if Telegram fails
    }

    return jsonSuccess(
      { submitted: true },
      'Laporan Anda telah terkirim. Admin akan segera menindaklanjuti.',
      201
    );
  } catch (error: any) {
    console.error('Submit report error:', error);
    return jsonError('Gagal mengirim laporan', 500);
  }
}

// GET /api/reports - Admin lihat daftar laporan (optional, need Report model)
export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return jsonError('Akses ditolak: Admin saja', 403);
    }

    // TODO: Implement when Report model exists
    return jsonSuccess({ reports: [], message: 'Report model belum diimplementasikan' });
  } catch (error: any) {
    console.error('Fetch reports error:', error);
    return jsonError('Gagal memuat laporan', 500);
  }
}