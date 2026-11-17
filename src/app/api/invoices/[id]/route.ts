import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession, requireAdmin } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';
import { NotificationService } from '@/lib/notifications/service';

const sparePartSchema = z.object({
  name: z.string().min(1),
  qty: z.number().int().min(1),
  unitPrice: z.number().min(0),
});

const updateInvoiceSchema = z.object({
  serviceFee: z.number().min(0).optional(),
  spareParts: z.array(sparePartSchema).optional(),
  discount: z.number().min(0).optional(),
  paymentStatus: z.enum(['UNPAID', 'PENDING', 'PAID', 'CANCELLED']).optional(),
  paymentMethod: z.enum(['Cash', 'Bank Transfer']).nullable().optional(),
  notes: z.string().nullable().optional(),
});

// GET /api/invoices/[id] — Admin all, Customer own only
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return jsonError('Tidak terautentikasi', 401);

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          customer: { include: { profile: true } },
          service: true,
          technician: { select: { id: true, name: true, phone: true } },
        },
      },
    },
  });

  if (!invoice) return jsonError('Invoice tidak ditemukan', 404);

  // Authorization: customer can only see their own invoice
  if (session.role === 'CUSTOMER' && invoice.order.customerId !== session.id) {
    return jsonError('Akses ditolak', 403);
  }

  return jsonSuccess({ invoice });
}

// PATCH /api/invoices/[id] — Admin only, can edit before PAID
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireAdmin().catch(() => null);
  if (!session) return jsonError('Akses ditolak: Admin saja', 403);

  try {
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) return jsonError('Invoice tidak ditemukan', 404);

    // Prevent editing a paid invoice (only payment status change allowed)
    const body = await req.json();
    const validation = updateInvoiceSchema.safeParse(body);
    if (!validation.success) {
      return jsonError(validation.error.errors[0]?.message || 'Input tidak valid', 400);
    }

    const { serviceFee, spareParts, discount, paymentStatus, paymentMethod, notes } = validation.data;

    // Build update data
    const updateData: any = {};

    // If paid and trying to edit financials, block
    if (existing.paymentStatus === 'PAID' && (serviceFee !== undefined || spareParts !== undefined || discount !== undefined)) {
      return jsonError('Invoice yang sudah PAID tidak dapat diedit secara finansial', 400);
    }

    if (serviceFee !== undefined) updateData.serviceFee = serviceFee;
    if (discount !== undefined) updateData.discount = discount;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (notes !== undefined) updateData.notes = notes;

    if (spareParts !== undefined) {
      updateData.spareParts = spareParts.length > 0 ? JSON.stringify(spareParts) : null;
    }

    // Recalculate totals if financial fields changed
    const finalServiceFee = serviceFee ?? existing.serviceFee;
    const finalDiscount = discount ?? existing.discount;
    const finalSpareParts: any[] = spareParts !== undefined
      ? spareParts
      : (existing.spareParts ? JSON.parse(existing.spareParts) : []);

    if (serviceFee !== undefined || spareParts !== undefined || discount !== undefined) {
      const partsTotal = finalSpareParts.reduce((sum: number, p: any) => sum + p.qty * p.unitPrice, 0);
      const subtotal = finalServiceFee + partsTotal;
      const total = Math.max(0, subtotal - finalDiscount);
      updateData.subtotal = subtotal;
      updateData.total = total;

      // Sync order finalCost
      await prisma.serviceOrder.update({
        where: { id: existing.orderId },
        data: { finalCost: total, estimatedCost: total },
      });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          include: {
            customer: { select: { id: true, name: true, email: true } },
            service: true,
          },
        },
      },
    });

    // Notify customer when invoice is confirmed as PAID
    if (paymentStatus === 'PAID' && existing.paymentStatus !== 'PAID') {
      const adminIds = await NotificationService.getAdminIds();
      await NotificationService.notifyPaymentReceived({
        customerId: updated.order.customerId,
        adminIds,
        orderNumber: updated.order.orderNumber,
        orderId: updated.order.id,
        invoiceNumber: updated.invoiceNumber,
        total: updated.total,
        paymentMethod: updated.paymentMethod || 'Cash',
      }).catch(() => {});
    }

    return jsonSuccess({ invoice: updated }, 'Invoice berhasil diperbarui');
  } catch (error: any) {
    console.error('Update invoice error:', error);
    return jsonError('Gagal memperbarui invoice', 500);
  }
}
