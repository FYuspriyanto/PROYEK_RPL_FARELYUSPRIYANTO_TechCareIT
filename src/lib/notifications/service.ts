import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import type { NotificationPayload, NotificationChannel } from './types';
import { whatsappChannel } from './whatsapp';
import { telegramChannel } from './telegram';

// =============================================
// In-App Notification Channel (MVP)
// =============================================
const inAppChannel: NotificationChannel = {
  name: 'in-app',
  async send(payload: NotificationPayload) {
    await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        link: payload.link ?? null,
        metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
      },
    });
  },
};

// =============================================
// Active channels list — swap/extend here for multi-channel.
// Email / WhatsApp / Telegram channels can be appended at runtime via
// NotificationService.registerChannel(emailChannel) without
// changing any calling code.
// =============================================
const activeChannels: NotificationChannel[] = [inAppChannel];

// Register WhatsApp channel if enabled
if (env.WHATSAPP_ENABLED) {
  activeChannels.push(whatsappChannel);
  console.log('[Notifications] WhatsApp channel registered');
}

// Register Telegram channel if enabled
if (env.TELEGRAM_ENABLED) {
  activeChannels.push(telegramChannel);
  console.log('[Notifications] Telegram channel registered');
}

// =============================================
// Core Notification Service
// =============================================
export const NotificationService = {
  /**
   * Register an additional delivery channel (e.g. email, WhatsApp).
   * Channels are fanned out in `send()` — callers never change.
   */
  registerChannel(channel: NotificationChannel): void {
    if (!activeChannels.some((c) => c.name === channel.name)) {
      activeChannels.push(channel);
    }
  },

  /** List currently active channel names (useful for diagnostics). */
  listChannels(): string[] {
    return activeChannels.map((c) => c.name);
  },

  /**
   * Send a notification through all active channels
   */
  async send(payload: NotificationPayload): Promise<void> {
    await Promise.allSettled(
      activeChannels.map((channel) => channel.send(payload))
    );
  },

  /**
   * Send to multiple recipients at once
   */
  async sendBulk(payloads: NotificationPayload[]): Promise<void> {
    await Promise.allSettled(payloads.map((p) => this.send(p)));
  },

  // =============================================
  // Order lifecycle notifications
  // =============================================

  async notifyOrderReceived(params: {
    customerId: string;
    adminIds: string[];
    orderNumber: string;
    orderId: string;
    serviceName: string;
  }) {
    const { customerId, adminIds, orderNumber, orderId, serviceName } = params;

    // Notify customer
    await this.send({
      userId: customerId,
      type: 'ORDER_RECEIVED',
      title: 'Permintaan Servis Diterima ✅',
      message: `Pesanan ${orderNumber} untuk layanan "${serviceName}" telah diterima. Tim kami akan segera menindaklanjuti.`,
      link: `/customer/orders/${orderId}`,
      metadata: { orderId, orderNumber },
    });

    // Notify all admins
    await this.sendBulk(
      adminIds.map((adminId) => ({
        userId: adminId,
        type: 'NEW_ORDER_ADMIN' as const,
        title: `📋 Service Request Baru`,
        message: `Pelanggan membuat permintaan servis baru ${orderNumber} untuk "${serviceName}".`,
        link: `/admin/orders/${orderId}`,
        metadata: { orderId, orderNumber },
      }))
    );
  },

  async notifyDiagnosing(params: {
    customerId: string;
    orderNumber: string;
    orderId: string;
    deviceBrand: string;
    deviceModel: string;
  }) {
    const { customerId, orderNumber, orderId, deviceBrand, deviceModel } = params;
    await this.send({
      userId: customerId,
      type: 'DIAGNOSING',
      title: 'Proses Diagnosa Dimulai 🔍',
      message: `Teknisi sedang mendiagnosa ${deviceBrand} ${deviceModel} pada pesanan ${orderNumber}.`,
      link: `/customer/orders/${orderId}`,
      metadata: { orderId, orderNumber },
    });
  },

  async notifyEstimateReady(params: {
    customerId: string;
    orderNumber: string;
    orderId: string;
    estimatedCost: number;
  }) {
    const { customerId, orderNumber, orderId, estimatedCost } = params;
    await this.send({
      userId: customerId,
      type: 'ESTIMATE_READY',
      title: 'Estimasi Biaya Tersedia 💰',
      message: `Estimasi biaya servis untuk pesanan ${orderNumber} telah ditetapkan: Rp ${estimatedCost.toLocaleString('id-ID')}.`,
      link: `/customer/orders/${orderId}`,
      metadata: { orderId, orderNumber, estimatedCost },
    });
  },

  async notifyApprovalNeeded(params: {
    customerId: string;
    adminIds: string[];
    orderNumber: string;
    orderId: string;
    estimatedCost: number;
  }) {
    const { customerId, adminIds, orderNumber, orderId, estimatedCost } = params;

    // 1) Estimasi biaya tersedia
    await this.send({
      userId: customerId,
      type: 'ESTIMATE_READY',
      title: 'Estimasi Biaya Tersedia 💰',
      message: `Estimasi biaya servis untuk pesanan ${orderNumber} telah ditetapkan: Rp ${estimatedCost.toLocaleString('id-ID')}.`,
      link: `/customer/orders/${orderId}`,
      metadata: { orderId, orderNumber, estimatedCost },
    });

    // 2) Customer perlu approval — Notify customer
    await this.send({
      userId: customerId,
      type: 'APPROVAL_NEEDED',
      title: '⏰ Persetujuan Biaya Diperlukan',
      message: `Diagnosa selesai untuk ${orderNumber}. Estimasi biaya Rp ${estimatedCost.toLocaleString('id-ID')}. Mohon berikan persetujuan Anda.`,
      link: `/customer/orders/${orderId}`,
      metadata: { orderId, orderNumber, estimatedCost },
    });

    // Notify admins that customer needs to approve
    await this.sendBulk(
      adminIds.map((adminId) => ({
        userId: adminId,
        type: 'CUSTOMER_APPROVAL' as const,
        title: 'Menunggu Persetujuan Customer',
        message: `Pesanan ${orderNumber} menunggu persetujuan biaya dari customer.`,
        link: `/admin/orders/${orderId}`,
        metadata: { orderId, orderNumber },
      }))
    );
  },

  async notifyInProgress(params: {
    customerId: string;
    orderNumber: string;
    orderId: string;
  }) {
    const { customerId, orderNumber, orderId } = params;
    await this.send({
      userId: customerId,
      type: 'IN_PROGRESS',
      title: 'Perbaikan Sedang Berlangsung 🔧',
      message: `Teknisi sedang mengerjakan perbaikan untuk pesanan ${orderNumber}. Kami akan memberitahu Anda ketika selesai.`,
      link: `/customer/orders/${orderId}`,
      metadata: { orderId, orderNumber },
    });
  },

  async notifyCompleted(params: {
    customerId: string;
    orderNumber: string;
    orderId: string;
    deviceBrand: string;
    deviceModel: string;
  }) {
    const { customerId, orderNumber, orderId, deviceBrand, deviceModel } = params;
    await this.send({
      userId: customerId,
      type: 'COMPLETED',
      title: '🎉 Servis Selesai! Perangkat Siap Diambil',
      message: `${deviceBrand} ${deviceModel} pada pesanan ${orderNumber} telah selesai diperbaiki dan siap diambil. Garansi 90 hari berlaku.`,
      link: `/customer/orders/${orderId}`,
      metadata: { orderId, orderNumber },
    });
  },

  async notifyInvoiceCreated(params: {
    customerId: string;
    orderNumber: string;
    orderId: string;
    invoiceNumber: string;
    total: number;
  }) {
    const { customerId, orderNumber, orderId, invoiceNumber, total } = params;
    await this.send({
      userId: customerId,
      type: 'INVOICE_CREATED',
      title: '📄 Invoice Dibuat',
      message: `Invoice ${invoiceNumber} senilai Rp ${total.toLocaleString('id-ID')} untuk pesanan ${orderNumber} telah dibuat.`,
      link: `/customer/invoices`,
      metadata: { orderId, orderNumber, invoiceNumber, total },
    });
  },

  async notifyPaymentReceived(params: {
    customerId: string;
    adminIds: string[];
    orderNumber: string;
    orderId: string;
    invoiceNumber: string;
    total: number;
    paymentMethod: string;
  }) {
    const { customerId, adminIds, orderNumber, orderId, invoiceNumber, total, paymentMethod } = params;

    // Notify customer
    await this.send({
      userId: customerId,
      type: 'PAYMENT_RECEIVED',
      title: '✅ Pembayaran Dikonfirmasi',
      message: `Pembayaran Rp ${total.toLocaleString('id-ID')} via ${paymentMethod} untuk invoice ${invoiceNumber} telah dikonfirmasi. Terima kasih!`,
      link: `/customer/invoices`,
      metadata: { orderId, orderNumber, invoiceNumber, total },
    });

    // Notify admins
    await this.sendBulk(
      adminIds.map((adminId) => ({
        userId: adminId,
        type: 'PAYMENT_UPDATE' as const,
        title: `💵 Pembayaran Diterima`,
        message: `Invoice ${invoiceNumber} (${orderNumber}) telah dibayar via ${paymentMethod} sebesar Rp ${total.toLocaleString('id-ID')}.`,
        link: `/admin/invoices`,
        metadata: { orderId, orderNumber, invoiceNumber, total },
      }))
    );
  },

  /**
   * Customer memberikan approval / penolakan atas estimasi biaya.
   * → Admin menerima notifikasi CUSTOMER_APPROVAL.
   */
  async notifyCustomerApprovalDecision(params: {
    adminIds: string[];
    customerName: string;
    orderNumber: string;
    orderId: string;
    approved: boolean;
  }) {
    const { adminIds, customerName, orderNumber, orderId, approved } = params;
    await this.sendBulk(
      adminIds.map((adminId) => ({
        userId: adminId,
        type: 'CUSTOMER_APPROVAL' as const,
        title: approved ? '✅ Customer Menyetujui Estimasi' : '❌ Customer Menolak Estimasi',
        message: approved
          ? `${customerName} menyetujui estimasi biaya untuk pesanan ${orderNumber}. Servis dapat dimulai.`
          : `${customerName} menolak estimasi biaya untuk pesanan ${orderNumber}. Mohon tindak lanjut.`,
        link: `/admin/orders/${orderId}`,
        metadata: { orderId, orderNumber, approved },
      }))
    );
  },

  /**
   * Customer melakukan pembayaran / konfirmasi pembayaran (UNPAID → PENDING).
   * → Admin menerima notifikasi PAYMENT_UPDATE untuk verifikasi.
   */
  async notifyPaymentPending(params: {
    adminIds: string[];
    customerName: string;
    orderNumber: string;
    orderId: string;
    invoiceNumber: string;
    total: number;
    paymentMethod: string;
  }) {
    const { adminIds, customerName, orderNumber, orderId, invoiceNumber, total, paymentMethod } = params;
    await this.sendBulk(
      adminIds.map((adminId) => ({
        userId: adminId,
        type: 'PAYMENT_UPDATE' as const,
        title: '💳 Konfirmasi Pembayaran Customer',
        message: `${customerName} mengonfirmasi pembayaran Rp ${total.toLocaleString('id-ID')} via ${paymentMethod} untuk invoice ${invoiceNumber} (${orderNumber}). Mohon verifikasi.`,
        link: `/admin/invoices`,
        metadata: { orderId, orderNumber, invoiceNumber, total, paymentMethod },
      }))
    );
  },

  // =============================================
  // Query helpers
  // =============================================

  /** Get unread notification count for a user */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  },

  /** Mark single notification as read */
  async markRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  },

  /** Mark all notifications as read for a user */
  async markAllRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },

  /** Get admin user IDs for bulk admin notifications */
  async getAdminIds(): Promise<string[]> {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    return admins.map((a) => a.id);
  },
};
