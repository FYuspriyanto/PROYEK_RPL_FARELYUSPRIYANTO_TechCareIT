import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';
import { NotificationService } from '@/lib/notifications/service';

const confirmPaymentSchema = z.object({
  paymentMethod: z.enum(['Cash', 'Bank Transfer'], {
    errorMap: () => ({ message: 'Metode pembayaran harus Cash atau Bank Transfer' }),
  }),
});

// POST /api/invoices/[id]/confirm-payment — Customer mengonfirmasi sudah membayar.
// UNPAID → PENDING, lalu admin menerima notifikasi untuk verifikasi.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return jsonError('Tidak terautentikasi. Silakan login terlebih dahulu.', 401);

  try {
    const body = await req.json();
    const validation = confirmPaymentSchema.safeParse(body);
    if (!validation.success) {
      return jsonError(validation.error.errors[0]?.message || 'Input tidak valid', 400);
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { order: true },
    });
    if (!invoice) return jsonError('Invoice tidak ditemukan', 404);

    // Ownership check — customer hanya bisa konfirmasi invoice miliknya
    if (session.role === 'CUSTOMER' && invoice.order.customerId !== session.id) {
      return jsonError('Akses ditolak', 403);
    }

    if (invoice.paymentStatus !== 'UNPAID') {
      return jsonError('Invoice ini sudah dikonfirmasi / tidak dapat dikonfirmasi ulang', 400);
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        paymentStatus: 'PENDING',
        paymentMethod: validation.data.paymentMethod,
      },
    });

    // Notify semua admin agar segera verifikasi pembayaran
    try {
      const adminIds = await NotificationService.getAdminIds();
      await NotificationService.notifyPaymentPending({
        adminIds,
        customerName: session.name,
        orderNumber: invoice.order.orderNumber,
        orderId: invoice.order.id,
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
        paymentMethod: validation.data.paymentMethod,
      });
    } catch {
      // notifikasi gagal tidak menggagalkan konfirmasi
    }

    return jsonSuccess(
      { invoice: updated },
      'Konfirmasi pembayaran terkirim. Admin akan segera memverifikasi.'
    );
  } catch (error) {
    console.error('Confirm payment error:', error);
    return jsonError('Gagal mengonfirmasi pembayaran', 500);
  }
}
