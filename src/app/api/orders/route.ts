import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { jsonError, jsonSuccess } from '@/lib/response';
import { NotificationService } from '@/lib/notifications/service';

// Validation schema for creating a service order
const createOrderSchema = z.object({
  serviceId: z.string().min(1, 'Layanan wajib dipilih'),
  deviceType: z.string().min(2, 'Jenis perangkat wajib diisi (misal: Laptop / PC Desktop)'),
  deviceBrand: z.string().min(2, 'Merk perangkat wajib diisi (misal: Asus, Lenovo, Apple)'),
  deviceModel: z.string().min(2, 'Model/tipe perangkat wajib diisi'),
  problemDescription: z.string().min(10, 'Deskripsi kerusakan minimal 10 karakter'),
  preferredSchedule: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/orders - List orders (Admin gets all, Customer gets only their own)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError('Tidak terautentikasi. Silakan login terlebih dahulu.', 401);
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    // Role-based filter
    const whereClause: any = {};

    if (session.role === 'CUSTOMER') {
      // STRICT SECURITY: Customer ONLY sees their own orders
      whereClause.customerId = session.id;
    }

    if (statusFilter && statusFilter !== 'ALL') {
      whereClause.status = statusFilter;
    }

    const orders = await prisma.serviceOrder.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profile: {
              select: {
                address: true,
              },
            },
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            priceFrom: true,
            estimatedDuration: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            phone: true,
            specialization: true,
          },
        },
        invoice: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return jsonSuccess({
      orders,
      count: orders.length,
      role: session.role,
    });
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    return jsonError('Gagal memuat data pesanan', 500);
  }
}

// POST /api/orders - Create a new service order (Customer or Admin)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError('Tidak terautentikasi. Silakan login terlebih dahulu.', 401);
    }

    const body = await req.json();
    const validation = createOrderSchema.safeParse(body);

    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || 'Input tidak valid';
      return jsonError(errorMsg, 400);
    }

    const {
      serviceId,
      deviceType,
      deviceBrand,
      deviceModel,
      problemDescription,
      preferredSchedule,
      address,
      notes,
    } = validation.data;

    // Verify service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return jsonError('Layanan IT yang dipilih tidak ditemukan', 404);
    }

    // Optionally update customer address if given
    if (address && session.id) {
      await prisma.customerProfile.upsert({
        where: { userId: session.id },
        create: { userId: session.id, address },
        update: { address },
      }).catch(() => {});
    }

    // Generate unique order and invoice numbers
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `SRV-${new Date().getFullYear()}-${timestamp}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${timestamp}-${randomSuffix}`;

    // Create Service Order with initial status REQUESTED and initial Invoice
    const newOrder = await prisma.serviceOrder.create({
      data: {
        orderNumber,
        customerId: session.id,
        serviceId: service.id,
        deviceType,
        deviceBrand,
        deviceModel,
        problemDescription,
        preferredSchedule: preferredSchedule || null,
        status: 'REQUESTED',
        estimatedCost: service.priceFrom,
        finalCost: service.priceFrom,
        notes: notes || null,
        invoice: {
          create: {
            invoiceNumber,
            subtotal: service.priceFrom,
            discount: 0,
            total: service.priceFrom,
            paymentStatus: 'UNPAID',
          },
        },
      },
      include: {
        service: true,
        invoice: true,
      },
    });

    // Fire notifications (non-blocking)
    NotificationService.getAdminIds().then((adminIds) => {
      NotificationService.notifyOrderReceived({
        customerId: session.id,
        adminIds,
        orderNumber,
        orderId: newOrder.id,
        serviceName: service.name,
      }).catch(() => {});
    }).catch(() => {});

    return jsonSuccess(
      { order: newOrder },
      'Pengajuan service berhasil dibuat. Teknisi kami akan segera memverifikasi.',
      201
    );
  } catch (error: any) {
    console.error('Create order error:', error);
    return jsonError('Gagal membuat pesanan service', 500);
  }
}

