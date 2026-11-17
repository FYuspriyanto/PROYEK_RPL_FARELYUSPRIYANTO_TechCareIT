import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession, requireAdmin } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';
import { NotificationService } from '@/lib/notifications/service';

// Spare part item shape
const sparePartSchema = z.object({
  name: z.string().min(1),
  qty: z.number().int().min(1),
  unitPrice: z.number().min(0),
});

const invoiceCreateSchema = z.object({
  orderId: z.string().min(1, 'Order ID wajib diisi'),
  serviceFee: z.number().min(0).default(0),
  spareParts: z.array(sparePartSchema).default([]),
  discount: z.number().min(0).default(0),
  paymentMethod: z.enum(['Cash', 'Bank Transfer']).optional(),
  notes: z.string().optional(),
});

// Compute subtotal & total from serviceFee + spareParts - discount
function calculateTotals(
  serviceFee: number,
  spareParts: { qty: number; unitPrice: number }[],
  discount: number
) {
  const partsTotal = spareParts.reduce((sum, p) => sum + p.qty * p.unitPrice, 0);
  const subtotal = serviceFee + partsTotal;
  const total = Math.max(0, subtotal - discount);
  return { subtotal, total };
}

// GET /api/invoices — Admin: all; Customer: own
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError('Tidak terautentikasi', 401);

  const whereClause: any = {};
  if (session.role === 'CUSTOMER') {
    whereClause.order = { customerId: session.id };
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status');
  if (statusFilter && statusFilter !== 'ALL') {
    whereClause.paymentStatus = statusFilter;
  }

  const invoices = await prisma.invoice.findMany({
    where: whereClause,
    include: {
      order: {
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          service: { select: { id: true, name: true, category: true } },
          technician: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return jsonSuccess({ invoices, count: invoices.length });
}

// POST /api/invoices — Admin creates invoice for an order
export async function POST(req: NextRequest) {
  const session = await requireAdmin().catch(() => null);
  if (!session) return jsonError('Akses ditolak: Admin saja', 403);

  try {
    const body = await req.json();
    const validation = invoiceCreateSchema.safeParse(body);
    if (!validation.success) {
      return jsonError(validation.error.errors[0]?.message || 'Input tidak valid', 400);
    }

    const { orderId, serviceFee, spareParts, discount, paymentMethod, notes } = validation.data;

    // Verify order exists
    const order = await prisma.serviceOrder.findUnique({
      where: { id: orderId },
      include: { invoice: true },
    });
    if (!order) return jsonError('Order tidak ditemukan', 404);
    if (order.invoice) return jsonError('Invoice untuk order ini sudah ada', 409);

    const { subtotal, total } = calculateTotals(serviceFee, spareParts, discount);

    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${timestamp}-${randomSuffix}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId,
        serviceFee,
        spareParts: spareParts.length > 0 ? JSON.stringify(spareParts) : null,
        subtotal,
        discount,
        total,
        paymentStatus: 'UNPAID',
        paymentMethod: paymentMethod || null,
        notes: notes || null,
      },
      include: {
        order: {
          include: {
            customer: { select: { id: true, name: true, email: true, phone: true } },
            service: true,
          },
        },
      },
    });

    // Also update order estimatedCost with new total
    await prisma.serviceOrder.update({
      where: { id: orderId },
      data: { estimatedCost: total, finalCost: total },
    });

    // Notify customer: invoice dibuat (non-blocking)
    NotificationService.notifyInvoiceCreated({
      customerId: order.customerId,
      orderNumber: order.orderNumber,
      orderId: order.id,
      invoiceNumber,
      total,
    }).catch(() => {});

    return jsonSuccess({ invoice }, 'Invoice berhasil dibuat', 201);
  } catch (error: any) {
    console.error('Create invoice error:', error);
    return jsonError('Gagal membuat invoice', 500);
  }
}
