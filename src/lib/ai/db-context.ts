/**
 * Role-Based Database Context Layer for TechCare AI Assistant
 *
 * Real-time live access to SQLite Database dengan pembatasan per role:
 * - GUEST (belum login): hanya data publik (katalog layanan, teknisi aktif, knowledge base).
 * - CUSTOMER: publik + data milik sendiri (profil, pesanan, invoice, notifikasi).
 *   TIDAK BISA melihat metrik bisnis internal (pendapatan, total pelanggan, total transaksi,
 *   invoice belum dibayar milik pelanggan lain, dsb).
 * - ADMIN: publik + seluruh data bisnis (statistik global, pendapatan, semua pesanan terbaru,
 *   breakdown status, invoice belum dibayar, pesanan menunggu approval, layanan terpopuler)
 *   beserta notifikasi admin.
 *
 * Role selalu diverifikasi dari record database (source of truth), bukan dari input client.
 */

import { prisma } from '@/lib/prisma';

export interface RawOrderInfo {
  orderNumber: string;
  status: string;
  statusLabel: string;
  serviceName: string;
  device: string;
  technicianName?: string;
  estimatedCost?: number;
  finalCost?: number;
  notes?: string;
  invoiceNumber?: string;
  paymentStatus?: string;
  paymentTotal?: number;
}

export interface RawInvoiceInfo {
  invoiceNumber: string;
  orderNumber: string;
  total: number;
  paymentStatus: string;
  paymentStatusLabel: string;
  paymentMethod?: string;
  customerName?: string;
}

export interface RawServiceInfo {
  id: string;
  name: string;
  category: string;
  priceFrom: number;
  estimatedDuration: string;
  description: string;
}

export interface RawAdminOrderInfo {
  orderNumber: string;
  customerName: string;
  serviceName: string;
  device: string;
  status: string;
  statusLabel: string;
  estimatedCost?: number;
  finalCost?: number;
  createdAt: Date;
}

export interface RawCustomerSummary {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  orderCount: number;
  createdAt: Date;
}

export interface RawTechnicianSummary {
  id: string;
  name: string;
  phone: string;
  specialization: string;
  isActive: boolean;
  assignedOrdersCount: number;
}

export interface DatabaseContext {
  role?: string;
  customerProfileText?: string;
  activeOrdersText?: string;
  orderHistoryText?: string;
  invoicesText?: string;
  servicesText?: string;
  techniciansText?: string;
  knowledgeBaseText?: string;
  adminOverviewText?: string;
  adminRecentOrdersText?: string;
  adminPendingApprovalsText?: string;
  adminUnpaidInvoicesText?: string;
  adminTopServicesText?: string;
  adminUsersListText?: string;
  technicianOrdersText?: string;
  technicianAssignedSummaryText?: string;
  notificationsText?: string;
  raw?: {
    userId?: string;
    userName?: string;
    userEmail?: string;
    userRole?: string;
    userPhone?: string;
    activeOrders: RawOrderInfo[];
    completedOrders: RawOrderInfo[];
    invoices: RawInvoiceInfo[];
    services: RawServiceInfo[];
    recentOrders?: RawAdminOrderInfo[];
    pendingApprovals?: RawAdminOrderInfo[];
    unpaidInvoiceList?: RawInvoiceInfo[];
    ordersByStatus?: Record<string, number>;
    topServices?: Array<{ name: string; count: number }>;
    totalServices?: number;
    totalCustomers?: number;
    totalOrders?: number;
    totalInvoicesUnpaid?: number;
    totalInvoicesPending?: number;
    totalInvoices?: number;
    totalRevenue?: number;
    totalTechnicians?: number;
    totalUsers?: number;
    activeOrdersCount?: number;
    completedOrdersCount?: number;
    customersList?: RawCustomerSummary[];
    techniciansList?: RawTechnicianSummary[];
  };
}

// Indonesian status labels (tanpa emoji agar aman di berbagai encoding)
export const ORDER_STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Menunggu Konfirmasi Admin / Penjadwalan',
  DIAGNOSING: 'Sedang Didiagnosa oleh Teknisi',
  WAITING_APPROVAL: 'Menunggu Persetujuan Customer (Biaya/Tindakan)',
  IN_PROGRESS: 'Sedang Dikerjakan oleh Teknisi',
  READY: 'Siap Diambil di Workshop',
  COMPLETED: 'Servis Selesai & Unit Telah Diambil',
  CANCELLED: 'Pesanan Dibatalkan',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: 'Belum Dibayar',
  PENDING: 'Menunggu Verifikasi Pembayaran',
  PAID: 'Lunas',
  CANCELLED: 'Dibatalkan',
};

/** Aggregate database metrics for AI analysis (hanya diisi untuk ADMIN) */
export interface DatabaseMetrics {
  totalUsers: number;
  totalCustomers: number;
  totalServices: number;
  totalOrders: number;
  totalInvoices: number;
  totalInvoicesUnpaid: number;
  totalRevenue: number;
  activeOrders: number;
  completedOrders: number;
}

const ACTIVE_ORDER_STATUSES = ['REQUESTED', 'DIAGNOSING', 'WAITING_APPROVAL', 'IN_PROGRESS', 'READY'];

function formatRupiah(value: number): string {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

function emptyRaw(): NonNullable<DatabaseContext['raw']> {
  return {
    activeOrders: [],
    completedOrders: [],
    invoices: [],
    services: [],
    recentOrders: [],
    pendingApprovals: [],
    unpaidInvoiceList: [],
    ordersByStatus: {},
    topServices: [],
    totalServices: 0,
    totalTechnicians: 0,
  };
}

/**
 * Build real-time database context for the AI Assistant.
 * Output disesuaikan sepenuhnya dengan role pengguna di database.
 */
export async function buildDatabaseContext(userId?: string): Promise<DatabaseContext> {
  const ctx: DatabaseContext = { raw: emptyRaw() };

  // ---------------------------------------------------------
  // 1. DATA PUBLIK (boleh diakses semua orang, termasuk guest)
  // ---------------------------------------------------------
  let kbArticles: Array<{ title: string; category: string; content: string }> = [];

  try {
    const [services, foundKbArticles, technicians] = await Promise.all([
      prisma.service.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
          priceFrom: true,
          estimatedDuration: true,
        },
        orderBy: { category: 'asc' },
      }),
      prisma.knowledgeBase.findMany({
        where: { isPublished: true },
        select: { title: true, category: true, content: true },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
      prisma.technician.findMany({
        where: { isActive: true },
        select: { name: true, specialization: true },
      }),
    ]);

    kbArticles = foundKbArticles;

    ctx.servicesText = services
      .map(
        (s) =>
          `- [${s.category}] ${s.name}\n  Biaya mulai: ${formatRupiah(s.priceFrom)}\n  Estimasi pengerjaan: ${s.estimatedDuration}\n  Rincian: ${s.description}`
      )
      .join('\n\n');

    ctx.raw!.services = services;

    ctx.techniciansText = technicians
      .map((t) => `- ${t.name} (Spesialisasi: ${t.specialization})`)
      .join('\n');

    ctx.raw!.totalServices = services.length;
    ctx.raw!.totalTechnicians = technicians.length;

    if (kbArticles.length > 0) {
      ctx.knowledgeBaseText = kbArticles
        .map((a, i) => `[KB${i + 1} - ${a.category}] ${a.title}\n${a.content}`)
        .join('\n\n---\n\n');
    }
  } catch (error) {
    console.error('[buildDatabaseContext] Error fetching public database data:', error);
  }

  // Tidak ada user -> guest: berhenti di data publik
  if (!userId) {
    ctx.role = 'GUEST';
    return ctx;
  }

  // ---------------------------------------------------------
  // 2. IDENTITAS PENGGUNA (verifikasi role dari DATABASE)
  // ---------------------------------------------------------
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      notifications: {
        where: { isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!user) {
    ctx.role = 'GUEST';
    return ctx;
  }

  const role = user.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER';
  ctx.role = role;
  ctx.raw!.userId = user.id;
  ctx.raw!.userName = user.name;
  ctx.raw!.userEmail = user.email;
  ctx.raw!.userRole = role;
  ctx.raw!.userPhone = user.phone || undefined;

  if (user.notifications.length > 0) {
    ctx.notificationsText = user.notifications
      .map((n) => `- [${n.type}] ${n.title}: ${n.message}`)
      .join('\n');
  }

  // =========================================================
  // 3A. ROLE ADMIN -> AKSES DATA BISNIS GLOBAL
  // =========================================================
  if (role === 'ADMIN') {
    const [
      totalCustomers,
      totalUsers,
      totalOrders,
      activeOrdersCount,
      completedOrdersCount,
      unpaidInvoicesCount,
      pendingInvoicesCount,
      invoiceAggregates,
      recentOrders,
      pendingApprovals,
      unpaidInvoiceList,
      ordersByStatusRaw,
      topServicesGrouped,
      allCustomers,
      allTechniciansDetail,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count(),
      prisma.serviceOrder.count(),
      prisma.serviceOrder.count({ where: { status: { in: ACTIVE_ORDER_STATUSES } } }),
      prisma.serviceOrder.count({ where: { status: 'COMPLETED' } }),
      prisma.invoice.count({ where: { paymentStatus: 'UNPAID' } }),
      prisma.invoice.count({ where: { paymentStatus: 'PENDING' } }),
      prisma.invoice.findMany({
        where: { paymentStatus: { in: ['PAID', 'UNPAID'] } },
        select: { paymentStatus: true, total: true },
      }),
      prisma.serviceOrder.findMany({
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: {
          customer: { select: { name: true } },
          service: { select: { name: true } },
          technician: { select: { name: true } },
          invoice: { select: { total: true, paymentStatus: true } },
        },
      }),
      prisma.serviceOrder.findMany({
        where: { status: 'WAITING_APPROVAL' },
        orderBy: { updatedAt: 'asc' },
        take: 5,
        include: {
          customer: { select: { name: true } },
          service: { select: { name: true } },
        },
      }),
      prisma.invoice.findMany({
        where: { paymentStatus: 'UNPAID' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          order: {
            include: { customer: { select: { name: true } } },
          },
        },
      }),
      prisma.serviceOrder.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.serviceOrder.groupBy({
        by: ['serviceId'],
        _count: { serviceId: true },
        orderBy: { _count: { serviceId: 'desc' } },
        take: 5,
      }),
      prisma.user.findMany({
        where: { role: 'CUSTOMER' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          profile: { select: { address: true } },
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.technician.findMany({
        select: {
          id: true,
          name: true,
          phone: true,
          specialization: true,
          isActive: true,
          _count: { select: { assignedOrders: true } },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    const totalRevenue = invoiceAggregates
      .filter((i) => i.paymentStatus === 'PAID')
      .reduce((sum, i) => sum + (i.total || 0), 0);
    const totalUnpaidAmount = invoiceAggregates
      .filter((i) => i.paymentStatus === 'UNPAID')
      .reduce((sum, i) => sum + (i.total || 0), 0);
    const totalInvoices = invoiceAggregates.length;

    const ordersByStatus: Record<string, number> = {};
    for (const row of ordersByStatusRaw) {
      ordersByStatus[row.status] = row._count.status;
    }

    const topServiceIds = topServicesGrouped.map((g) => g.serviceId);
    const topServiceRecords = topServiceIds.length
      ? await prisma.service.findMany({
          where: { id: { in: topServiceIds } },
          select: { id: true, name: true },
        })
      : [];
    const topServices = topServicesGrouped
      .map((g) => ({
        name: topServiceRecords.find((s) => s.id === g.serviceId)?.name || 'Layanan',
        count: g._count.serviceId,
      }));

    const mapAdminOrder = (o: (typeof recentOrders)[number]): RawAdminOrderInfo => ({
      orderNumber: o.orderNumber,
      customerName: o.customer.name,
      serviceName: o.service.name,
      device: `${o.deviceType} ${o.deviceBrand} ${o.deviceModel}`,
      status: o.status,
      statusLabel: ORDER_STATUS_LABELS[o.status] || o.status,
      estimatedCost: o.estimatedCost ?? undefined,
      finalCost: o.finalCost ?? undefined,
      createdAt: o.createdAt,
    });

    ctx.raw!.totalCustomers = totalCustomers;
    ctx.raw!.totalUsers = totalUsers;
    ctx.raw!.totalOrders = totalOrders;
    ctx.raw!.activeOrdersCount = activeOrdersCount;
    ctx.raw!.completedOrdersCount = completedOrdersCount;
    ctx.raw!.totalInvoices = totalInvoices;
    ctx.raw!.totalInvoicesUnpaid = unpaidInvoicesCount;
    ctx.raw!.totalInvoicesPending = pendingInvoicesCount;
    ctx.raw!.totalRevenue = totalRevenue;
    ctx.raw!.ordersByStatus = ordersByStatus;
    ctx.raw!.recentOrders = recentOrders.map(mapAdminOrder);
    ctx.raw!.pendingApprovals = pendingApprovals.map((o) => ({
      orderNumber: o.orderNumber,
      customerName: o.customer.name,
      serviceName: o.service.name,
      device: `${o.deviceType} ${o.deviceBrand} ${o.deviceModel}`,
      status: o.status,
      statusLabel: ORDER_STATUS_LABELS[o.status] || o.status,
      estimatedCost: o.estimatedCost ?? undefined,
      finalCost: o.finalCost ?? undefined,
      createdAt: o.createdAt,
    }));
    ctx.raw!.unpaidInvoiceList = unpaidInvoiceList.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      orderNumber: inv.order.orderNumber,
      total: inv.total,
      paymentStatus: inv.paymentStatus,
      paymentStatusLabel: PAYMENT_STATUS_LABELS[inv.paymentStatus] || inv.paymentStatus,
      paymentMethod: inv.paymentMethod || undefined,
      customerName: inv.order.customer.name,
    }));
    ctx.raw!.topServices = topServices;
    ctx.raw!.customersList = allCustomers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone || undefined,
      address: c.profile?.address || undefined,
      orderCount: c._count.orders,
      createdAt: c.createdAt,
    }));
    ctx.raw!.techniciansList = allTechniciansDetail.map((t) => ({
      id: t.id,
      name: t.name,
      phone: t.phone,
      specialization: t.specialization,
      isActive: t.isActive,
      assignedOrdersCount: t._count.assignedOrders,
    }));

    ctx.adminUsersListText = allCustomers
      .map((c, i) => `${i + 1}. ${c.name} (${c.email}${c.phone ? `, Telp: ${c.phone}` : ''}) - Total Pesanan: ${c._count.orders}`)
      .join('\n');

    const statusBreakdown = Object.entries(ordersByStatus)
      .map(([status, count]) => `   - ${status}: ${count} pesanan`)
      .join('\n');

    ctx.adminOverviewText = [
      `Total Pelanggan Terdaftar: ${totalCustomers} orang (dari ${totalUsers} akun)`,
      `Total Pesanan Sistem: ${totalOrders} pesanan`,
      `   - Pesanan Aktif: ${activeOrdersCount}`,
      `   - Pesanan Selesai: ${completedOrdersCount}`,
      statusBreakdown ? `Breakdown per Status:\n${statusBreakdown}` : '',
      `Invoice Belum Terbayar: ${unpaidInvoicesCount} invoice (total ${formatRupiah(totalUnpaidAmount)})`,
      `Invoice Menunggu Verifikasi: ${pendingInvoicesCount} invoice`,
      `Total Pendapatan (Invoice PAID): ${formatRupiah(totalRevenue)}`,
      `Teknisi Aktif: ${ctx.raw!.totalTechnicians} teknisi`,
      `Total Layanan Aktif: ${ctx.raw!.totalServices} layanan`,
    ]
      .filter(Boolean)
      .join('\n');

    ctx.adminRecentOrdersText = ctx.raw!.recentOrders!
      .map((o) => {
        const match = recentOrders.find((r) => r.orderNumber === o.orderNumber);
        const invTotal = match?.invoice?.total;
        return [
          `- ${o.orderNumber} | ${o.customerName}`,
          `  Layanan: ${o.serviceName} | Perangkat: ${o.device}`,
          `  Status: ${o.statusLabel}${invTotal !== undefined ? ` | Invoice: ${formatRupiah(invTotal)}` : ''}`,
          `  Masuk: ${o.createdAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        ].join('\n');
      })
      .join('\n\n');

    if (ctx.raw!.pendingApprovals!.length > 0) {
      ctx.adminPendingApprovalsText = ctx.raw!.pendingApprovals!
        .map(
          (o) =>
            `- ${o.orderNumber} | ${o.customerName} | ${o.serviceName} | Estimasi: ${o.estimatedCost !== undefined ? formatRupiah(o.estimatedCost) : '-'}`
        )
        .join('\n');
    }

    if (ctx.raw!.unpaidInvoiceList!.length > 0) {
      ctx.adminUnpaidInvoicesText = ctx.raw!.unpaidInvoiceList!
        .map(
          (inv) =>
            `- ${inv.invoiceNumber} (Pesanan: ${inv.orderNumber}) | ${inv.customerName || 'Customer'} | Total: ${formatRupiah(inv.total)}`
        )
        .join('\n');
    }

    if (topServices.length > 0) {
      ctx.adminTopServicesText = topServices
        .map((s, i) => `${i + 1}. ${s.name} - ${s.count} pesanan`)
        .join('\n');
    }

    return ctx;
  }

  // =========================================================
  // 3B. ROLE CUSTOMER -> HANYA DATA MILIK SENDIRI
  // =========================================================
  const customerData = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      profile: true,
      orders: {
        include: {
          service: { select: { name: true, category: true } },
          technician: { select: { name: true } },
          invoice: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      },
    },
  });

  if (!customerData) {
    ctx.role = 'GUEST';
    return ctx;
  }

  ctx.customerProfileText = [
    `Nama Pelanggan: ${customerData.name}`,
    `Email Akun: ${customerData.email}`,
    `Nomor Telepon: ${customerData.phone || 'Belum diisi'}`,
    `Alamat: ${customerData.profile?.address || 'Belum diisi'}`,
    `Peran Akun: CUSTOMER`,
    `Total Pesanan Tercatat: ${customerData.orders.length} pesanan`,
  ].join('\n');

  const activeOrdersList = customerData.orders.filter((o) =>
    ACTIVE_ORDER_STATUSES.includes(o.status)
  );
  const completedOrdersList = customerData.orders.filter((o) =>
    ['COMPLETED', 'CANCELLED'].includes(o.status)
  );

  if (activeOrdersList.length > 0) {
    ctx.activeOrdersText = activeOrdersList
      .map((o) => {
        const rawOrder: RawOrderInfo = {
          orderNumber: o.orderNumber,
          status: o.status,
          statusLabel: ORDER_STATUS_LABELS[o.status] || o.status,
          serviceName: o.service.name,
          device: `${o.deviceType} ${o.deviceBrand} ${o.deviceModel}`,
          technicianName: o.technician?.name,
          estimatedCost: o.estimatedCost || undefined,
          finalCost: o.finalCost || undefined,
          notes: o.notes || undefined,
          invoiceNumber: o.invoice?.invoiceNumber,
          paymentStatus: o.invoice?.paymentStatus,
          paymentTotal: o.invoice?.total,
        };
        ctx.raw!.activeOrders.push(rawOrder);

        const lines = [
          `Nomor Pesanan: ${o.orderNumber}`,
          `   Status Terkini: ${ORDER_STATUS_LABELS[o.status] || o.status}`,
          `   Layanan: ${o.service.name} (${o.service.category})`,
          `   Perangkat: ${o.deviceType} ${o.deviceBrand} ${o.deviceModel}`,
          `   Keluhan/Kendala: ${o.problemDescription}`,
          `   Teknisi Bertugas: ${o.technician?.name || 'Sedang dialokasikan'}`,
          `   Estimasi Biaya: ${o.estimatedCost ? formatRupiah(o.estimatedCost) : 'Sedang dalam pengecekan teknisi'}`,
          `   Biaya Final: ${o.finalCost ? formatRupiah(o.finalCost) : 'Belum ditetapkan'}`,
          `   Jadwal Pilihan: ${o.preferredSchedule || '-'}`,
          `   Tanggal Masuk: ${o.createdAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        ];

        if (o.notes) {
          lines.push(`   Catatan Teknisi: "${o.notes}"`);
        }

        if (o.invoice) {
          lines.push(
            `   Invoice Tagihan: ${o.invoice.invoiceNumber}`,
            `   Status Pembayaran: ${PAYMENT_STATUS_LABELS[o.invoice.paymentStatus] || o.invoice.paymentStatus}`,
            `   Total Tagihan: ${formatRupiah(o.invoice.total)}`,
            `   Metode Bayar: ${o.invoice.paymentMethod || 'Belum dipilih'}`
          );
        }

        return lines.join('\n');
      })
      .join('\n\n');
  }

  if (completedOrdersList.length > 0) {
    ctx.orderHistoryText = completedOrdersList
      .slice(0, 5)
      .map((o) => {
        const rawHist: RawOrderInfo = {
          orderNumber: o.orderNumber,
          status: o.status,
          statusLabel: ORDER_STATUS_LABELS[o.status] || o.status,
          serviceName: o.service.name,
          device: `${o.deviceType} ${o.deviceBrand} ${o.deviceModel}`,
          technicianName: o.technician?.name,
          finalCost: o.finalCost || undefined,
        };
        ctx.raw!.completedOrders.push(rawHist);

        return [
          `${o.orderNumber} - ${o.service.name}`,
          `   Status: ${ORDER_STATUS_LABELS[o.status] || o.status}`,
          `   Perangkat: ${o.deviceType} ${o.deviceBrand} ${o.deviceModel}`,
          `   Biaya: ${o.finalCost ? formatRupiah(o.finalCost) : '-'}`,
          `   Tanggal Selesai: ${o.updatedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        ].join('\n');
      })
      .join('\n\n');
  }

  const userInvoices = customerData.orders
    .filter((o) => o.invoice)
    .map((o) => ({ order: o, inv: o.invoice! }));

  if (userInvoices.length > 0) {
    ctx.invoicesText = userInvoices
      .map(({ order, inv }) => {
        const rawInv: RawInvoiceInfo = {
          invoiceNumber: inv.invoiceNumber,
          orderNumber: order.orderNumber,
          total: inv.total,
          paymentStatus: inv.paymentStatus,
          paymentStatusLabel: PAYMENT_STATUS_LABELS[inv.paymentStatus] || inv.paymentStatus,
          paymentMethod: inv.paymentMethod || undefined,
        };
        ctx.raw!.invoices.push(rawInv);

        return [
          `Invoice: ${inv.invoiceNumber} (Pesanan: ${order.orderNumber})`,
          `   Layanan: ${order.service.name}`,
          `   Status Pembayaran: ${PAYMENT_STATUS_LABELS[inv.paymentStatus] || inv.paymentStatus}`,
          `   Total Nominal: ${formatRupiah(inv.total)}`,
          `   Metode Pembayaran: ${inv.paymentMethod || 'Belum dipilih (Tersedia: Cash / Transfer Bank)'}`,
          `   Tanggal Diterbitkan: ${inv.createdAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        ].join('\n');
      })
      .join('\n\n');
  }

  // PENTING: customer TIDAK menerima metrik bisnis internal apapun
  // (totalRevenue, totalCustomers, totalOrders, totalInvoicesUnpaid sengaja tidak diisi).

  return ctx;
}

/** @deprecated Gunakan buildDatabaseContext. Nama dipertahankan untuk kompatibilitas. */
export const buildCustomerDatabaseContext = buildDatabaseContext;

/**
 * Format the full database context into a system prompt section.
 * Seksi data bisnis hanya muncul untuk ADMIN; customer hanya melihat data sendiri.
 */
export function formatDatabaseContextForPrompt(ctx: DatabaseContext): string {
  const role = ctx.role || (ctx.raw?.userId ? ctx.raw?.userRole || 'CUSTOMER' : 'GUEST');
  const sections: string[] = [];

  const scopeLabel =
    role === 'ADMIN'
      ? 'AKSES ADMIN: dapat melihat statistik & seluruh data bisnis (pesanan sistem, invoice, pendapatan)'
      : role === 'CUSTOMER'
        ? 'AKSES CUSTOMER: HANYA data milik akun sendiri (profil, pesanan, invoice pribadi). Data bisnis internal TIDAK tersedia untuk role ini.'
        : 'AKSES TAMU: hanya data publik (katalog layanan, teknisi, knowledge base). Data pribadi memerlukan login.';

  sections.push(
    `=== KONEKSI DATABASE LIVE TECHCARE ===\n` +
      `Status Koneksi: AKTIF & TERHUBUNG LANGSUNG KE DATABASE\n` +
      `Pengguna: ${ctx.raw?.userName ? `${ctx.raw.userName} (${ctx.raw.userEmail}, Role: ${role})` : 'Tamu / Belum Login'}\n` +
      `Cakupan Akses: ${scopeLabel}`
  );

  if (role === 'ADMIN') {
    if (ctx.adminOverviewText) {
      sections.push(`=== STATISTIK BISNIS & SISTEM ADMIN (DATABASE) ===\n${ctx.adminOverviewText}`);
    }
    if (ctx.adminRecentOrdersText) {
      sections.push(`=== PESANAN TERBARU SISTEM (DATABASE) ===\n${ctx.adminRecentOrdersText}`);
    }
    if (ctx.adminPendingApprovalsText) {
      sections.push(`=== PESANAN MENUNGGU APPROVAL CUSTOMER (DATABASE) ===\n${ctx.adminPendingApprovalsText}`);
    } else {
      sections.push(`=== PESANAN MENUNGGU APPROVAL CUSTOMER (DATABASE) ===\nTidak ada pesanan yang menunggu approval.`);
    }
    if (ctx.adminUnpaidInvoicesText) {
      sections.push(`=== INVOICE BELUM DIBAYAR TERBARU (DATABASE) ===\n${ctx.adminUnpaidInvoicesText}`);
    }
    if (ctx.adminTopServicesText) {
      sections.push(`=== LAYANAN TERPOPULER (DATABASE) ===\n${ctx.adminTopServicesText}`);
    }
    if (ctx.adminUsersListText) {
      sections.push(`=== DAFTAR PELANGGAN TERDAFTAR (DATABASE) ===\n${ctx.adminUsersListText}`);
    }
  }

  if (ctx.customerProfileText) {
    sections.push(`=== DATA PROFIL PENGGUNA (DATABASE) ===\n${ctx.customerProfileText}`);
  }

  if (ctx.activeOrdersText) {
    sections.push(`=== PESANAN AKTIF SAAT INI (DATABASE) ===\n${ctx.activeOrdersText}`);
  } else if (role === 'CUSTOMER') {
    sections.push(`=== PESANAN AKTIF SAAT INI (DATABASE) ===\nCustomer ini saat ini belum memiliki pesanan aktif.`);
  }

  if (ctx.invoicesText) {
    sections.push(`=== INVOICE & TAGIHAN SAAT INI (DATABASE) ===\n${ctx.invoicesText}`);
  } else if (role === 'CUSTOMER') {
    sections.push(`=== INVOICE & TAGIHAN SAAT INI (DATABASE) ===\nTidak ada invoice atau tagihan tertunggak untuk customer ini.`);
  }

  if (ctx.orderHistoryText) {
    sections.push(`=== RIWAYAT PESANAN SELESAI (DATABASE) ===\n${ctx.orderHistoryText}`);
  }

  if (ctx.notificationsText) {
    sections.push(`=== NOTIFIKASI TERBARU (DATABASE) ===\n${ctx.notificationsText}`);
  }

  if (ctx.servicesText) {
    sections.push(`=== DAFTAR LAYANAN & TARIF RESMI (DATABASE) ===\n${ctx.servicesText}`);
  }

  if (ctx.techniciansText) {
    sections.push(`=== DAFTAR TIM TEKNISI RESMI (DATABASE) ===\n${ctx.techniciansText}`);
  }

  if (ctx.knowledgeBaseText) {
    sections.push(`=== KNOWLEDGE BASE PERUSAHAAN (DATABASE) ===\n${ctx.knowledgeBaseText}`);
  }

  return sections.join('\n\n');
}
