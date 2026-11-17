import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';
import { NotificationService } from '@/lib/notifications/service';

const approveSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT'], {
    errorMap: () => ({ message: 'Aksi harus APPROVE atau REJECT' }),
  }),
});

// POST /api/orders/[id]/approve — Customer menyetujui / menolak estimasi biaya.
// Hanya untuk order milik sendiri dengan status WAITING_APPROVAL.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return jsonError('Tidak terautentikasi. Silakan login terlebih dahulu.', 401);

  try {
    const body = await req.json();
    const validation = approveSchema.safeParse(body);
    if (!validation.success) {
      return jsonError(validation.error.errors[0]?.message || 'Input tidak valid', 400);
    }

    const order = await prisma.serviceOrder.findUnique({ where: { id } });
    if (!order) return jsonError('Pesanan tidak ditemukan', 404);

    // Ownership check — customer hanya bisa approve order miliknya
    if (session.role === 'CUSTOMER' && order.customerId !== session.id) {
      return jsonError('Akses ditolak', 403);
    }

    if (order.status !== 'WAITING_APPROVAL') {
      return jsonError('Pesanan ini tidak sedang menunggu persetujuan', 400);
    }

    const approved = validation.data.action === 'APPROVE';
    const nextStatus = approved ? 'IN_PROGRESS' : 'CANCELLED';

    const updatedOrder = await prisma.serviceOrder.update({
      where: { id },
      data: {
        status: nextStatus,
        notes: approved
          ? (order.notes ?? null)
          : 'Estimasi biaya ditolak oleh customer.',
      },
      include: { service: true, invoice: true },
    });

    // Notify semua admin tentang keputusan customer (non-blocking aman)
    try {
      const adminIds = await NotificationService.getAdminIds();
      await NotificationService.notifyCustomerApprovalDecision({
        adminIds,
        customerName: session.name,
        orderNumber: order.orderNumber,
        orderId: order.id,
        approved,
      });
    } catch {
      // notifikasi gagal tidak menggagalkan approval
    }

    // Jika disetujui, customer juga dapat notif "servis mulai dikerjakan"
    if (approved) {
      try {
        await NotificationService.notifyInProgress({
          customerId: order.customerId,
          orderNumber: order.orderNumber,
          orderId: order.id,
        });
      } catch {
        // abaikan
      }
    }

    return jsonSuccess(
      { order: updatedOrder, approved },
      approved
        ? 'Estimasi disetujui. Teknisi akan segera memulai perbaikan.'
        : 'Estimasi ditolak. Pesanan dibatalkan, admin akan menindaklanjuti.'
    );
  } catch (error) {
    console.error('Approve order error:', error);
    return jsonError('Gagal memproses persetujuan', 500);
  }
}
