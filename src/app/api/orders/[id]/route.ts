import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';
import { NotificationService } from '@/lib/notifications/service';

const ORDER_STATUSES = [
  'REQUESTED',
  'DIAGNOSING',
  'WAITING_APPROVAL',
  'IN_PROGRESS',
  'READY',
  'COMPLETED',
  'CANCELLED',
] as const;

const PAYMENT_STATUSES = ['UNPAID', 'PENDING', 'PAID', 'CANCELLED'] as const;

const updateOrderSchema = z.object({
  status: z.enum(ORDER_STATUSES as unknown as [string, ...string[]]).optional(),
  technicianId: z.string().nullable().optional(),
  estimatedCost: z.number().min(0).nullable().optional(),
  finalCost: z.number().min(0).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  invoicePaymentStatus: z.enum(PAYMENT_STATUSES as unknown as [string, ...string[]]).optional(),
});

// GET /api/orders/[id] — Admin only
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return jsonError('Akses ditolak: Admin saja', 403);

    const order = await prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        customer: { include: { profile: true } },
        service: true,
        technician: true,
        invoice: true,
      },
    });

    if (!order) return jsonError('Pesanan tidak ditemukan', 404);
    return jsonSuccess({ order });
  } catch {
    return jsonError('Gagal memuat pesanan', 500);
  }
}

// PATCH /api/orders/[id] — Admin only; triggers notifications on status change
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return jsonError('Akses ditolak: Admin saja', 403);

    const body = await req.json();
    const validation = updateOrderSchema.safeParse(body);
    if (!validation.success) {
      return jsonError(validation.error.errors[0]?.message || 'Input tidak valid', 400);
    }

    const { status, technicianId, estimatedCost, finalCost, notes, invoicePaymentStatus } =
      validation.data;

    // Fetch current order state for notification context
    const currentOrder = await prisma.serviceOrder.findUnique({
      where: { id },
      include: { service: true, invoice: true },
    });
    if (!currentOrder) return jsonError('Pesanan tidak ditemukan', 404);

    // Build update data
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (technicianId !== undefined) updateData.technicianId = technicianId;
    if (estimatedCost !== undefined) updateData.estimatedCost = estimatedCost;
    if (finalCost !== undefined) updateData.finalCost = finalCost;
    if (notes !== undefined) updateData.notes = notes;

    // Update order
    const updatedOrder = await prisma.serviceOrder.update({
      where: { id },
      data: updateData,
      include: { service: true, invoice: true, technician: true },
    });

    // Update invoice if payment status changed
    if (invoicePaymentStatus && updatedOrder.invoice) {
      const invoiceUpdate: any = { paymentStatus: invoicePaymentStatus };
      if (finalCost != null) {
        invoiceUpdate.total = finalCost;
        invoiceUpdate.subtotal = finalCost;
        invoiceUpdate.serviceFee = finalCost;
      }
      await prisma.invoice.update({
        where: { orderId: id },
        data: invoiceUpdate,
      });
    }

    // =============================================
    // Trigger notifications based on status change
    // =============================================
    if (status && status !== currentOrder.status) {
      const customerId = currentOrder.customerId;
      const orderNumber = currentOrder.orderNumber;
      const orderId = currentOrder.id;
      const deviceBrand = currentOrder.deviceBrand;
      const deviceModel = currentOrder.deviceModel;
      const adminIds = await NotificationService.getAdminIds();

      switch (status) {
        case 'DIAGNOSING':
          await NotificationService.notifyDiagnosing({
            customerId, orderNumber, orderId, deviceBrand, deviceModel,
          });
          break;

        case 'WAITING_APPROVAL': {
          const cost = estimatedCost ?? currentOrder.estimatedCost ?? 0;
          await NotificationService.notifyApprovalNeeded({
            customerId, adminIds, orderNumber, orderId, estimatedCost: cost,
          });
          break;
        }

        case 'IN_PROGRESS':
          await NotificationService.notifyInProgress({ customerId, orderNumber, orderId });
          break;

        case 'READY':
        case 'COMPLETED':
          await NotificationService.notifyCompleted({
            customerId, orderNumber, orderId, deviceBrand, deviceModel,
          });
          if (updatedOrder.invoice) {
            await NotificationService.notifyInvoiceCreated({
              customerId,
              orderNumber,
              orderId,
              invoiceNumber: updatedOrder.invoice.invoiceNumber,
              total: updatedOrder.invoice.total,
            });
          }
          break;

        default:
          break;
      }
    }

    // Notify customer + admins when payment is confirmed PAID
    if (
      invoicePaymentStatus === 'PAID' &&
      currentOrder.invoice &&
      invoicePaymentStatus !== currentOrder.invoice.paymentStatus
    ) {
      const adminIds = await NotificationService.getAdminIds();
      await NotificationService.notifyPaymentReceived({
        customerId: currentOrder.customerId,
        adminIds,
        orderNumber: currentOrder.orderNumber,
        orderId: currentOrder.id,
        invoiceNumber: currentOrder.invoice.invoiceNumber,
        total: finalCost ?? currentOrder.invoice.total,
        paymentMethod: currentOrder.invoice.paymentMethod || 'Cash',
      });
    }

    return jsonSuccess({ order: updatedOrder }, 'Pesanan berhasil diperbarui');
  } catch (error: any) {
    console.error('Update order error:', error);
    return jsonError('Gagal memperbarui pesanan', 500);
  }
}
