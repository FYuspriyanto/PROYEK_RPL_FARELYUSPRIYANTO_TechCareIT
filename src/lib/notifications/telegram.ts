// =============================================
// Telegram Notification Channel
// =============================================

import { env } from '@/lib/env';
import type { NotificationPayload, NotificationChannel } from './types';

// Build message template based on notification type
export function buildTelegramMessage(payload: NotificationPayload): string {
  const timestamp = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'short',
    timeStyle: 'short',
  });

  let emoji = '📢';
  switch (payload.type) {
    case 'NEW_ORDER_ADMIN':
    case 'ORDER_RECEIVED':
      emoji = '📋';
      break;
    case 'PAYMENT_UPDATE':
    case 'PAYMENT_RECEIVED':
    case 'INVOICE_CREATED':
      emoji = '💰';
      break;
    case 'CUSTOMER_APPROVAL':
      emoji = '⏰';
      break;
    case 'DIAGNOSING':
      emoji = '🔍';
      break;
    case 'IN_PROGRESS':
      emoji = '🔧';
      break;
    case 'COMPLETED':
      emoji = '✅';
      break;
    case 'ESTIMATE_READY':
    case 'APPROVAL_NEEDED':
      emoji = '💵';
      break;
    case 'USER_REGISTERED':
      emoji = '👤';
      break;
    case 'USER_REPORT':
      emoji = '📝';
      break;
  }

  const lines = [
    `${emoji} <b>${env.TELEGRAM_SENDER_NAME} - Notifikasi Admin</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `<b>${payload.title}</b>`,
    ``,
    payload.message,
    ``,
    `🕐 ${timestamp}`,
  ];

  // Add metadata info if available
  if (payload.metadata) {
    const meta = payload.metadata as Record<string, unknown>;
    if (meta.orderNumber) lines.push(`📦 Order: <code>${meta.orderNumber}</code>`);
    if (meta.invoiceNumber) lines.push(`🧾 Invoice: <code>${meta.invoiceNumber}</code>`);
    if (meta.total !== undefined) lines.push(`💵 Total: Rp ${Number(meta.total).toLocaleString('id-ID')}`);
    if (meta.customerName) lines.push(`👤 Customer: ${meta.customerName}`);
    if (meta.customerEmail) lines.push(`📧 Email: ${meta.customerEmail}`);
    if (meta.customerPhone) lines.push(`📱 Phone: ${meta.customerPhone}`);
    if (meta.userName) lines.push(`👤 Nama: ${meta.userName}`);
    if (meta.userEmail) lines.push(`📧 Email: ${meta.userEmail}`);
    if (meta.userPhone) lines.push(`📱 Phone: ${meta.userPhone}`);
    if (meta.subject) lines.push(`📌 Subjek: ${meta.subject}`);
  }

  if (payload.link) {
    const fullLink = `${env.APP_URL}${payload.link}`;
    lines.push(``, `🔗 <a href="${fullLink}">Lihat Detail</a>`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`<i>Pesan otomatis dari sistem</i>`);

  return lines.join('\n');
}

// Send message via Telegram Bot API
async function sendTelegramMessage(chatId: string, message: string): Promise<boolean> {
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.warn('[Telegram] Bot token not configured');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Telegram] Send failed:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('[Telegram] Sent successfully:', result.ok);
    return result.ok === true;
  } catch (error) {
    console.error('[Telegram] Send error:', error);
    return false;
  }
}

// Main Telegram channel implementation
export const telegramChannel: NotificationChannel = {
  name: 'telegram',
  async send(payload: NotificationPayload) {
    if (!env.TELEGRAM_ENABLED) {
      console.log('[Telegram] Disabled, skipping');
      return;
    }

    const adminChatId = env.TELEGRAM_ADMIN_CHAT_ID;
    if (!adminChatId) {
      console.warn('[Telegram] Admin chat ID not configured');
      return;
    }

    const message = buildTelegramMessage(payload);
    const success = await sendTelegramMessage(adminChatId, message);

    if (!success) {
      console.error(`[Telegram] Failed to send notification type: ${payload.type}`);
    }
  },
};

// Helper to send custom Telegram message directly to admin
export async function sendAdminTelegramDirect(message: string): Promise<boolean> {
  if (!env.TELEGRAM_ENABLED) {
    console.log('[Telegram] Disabled, skipping direct send');
    return false;
  }

  const adminChatId = env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminChatId) {
    console.warn('[Telegram] Admin chat ID not configured');
    return false;
  }

  return sendTelegramMessage(adminChatId, message);
}

// Helper to send user registration notification
export async function notifyUserRegisteredTelegram(userData: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}): Promise<void> {
  const payload: NotificationPayload = {
    userId: 'admin',
    type: 'USER_REGISTERED' as any,
    title: '👤 User Baru Mendaftar',
    message: `User baru telah mendaftar akun:\n\n👤 Nama: ${userData.name}\n📧 Email: ${userData.email}${userData.phone ? `\n📱 Phone: ${userData.phone}` : ''}${userData.address ? `\n📍 Alamat: ${userData.address}` : ''}`,
    metadata: {
      userName: userData.name,
      userEmail: userData.email,
      userPhone: userData.phone,
      userAddress: userData.address,
    },
  };

  await telegramChannel.send(payload);
}

// Helper to send user report/complaint notification
export async function notifyUserReportTelegram(reportData: {
  userName: string;
  userEmail: string;
  userPhone?: string;
  subject: string;
  message: string;
}): Promise<void> {
  const payload: NotificationPayload = {
    userId: 'admin',
    type: 'USER_REPORT' as any,
    title: '📝 Laporan / Keluhan Baru',
    message: `Laporan baru dari user:\n\n👤 Nama: ${reportData.userName}\n📧 Email: ${reportData.userEmail}${reportData.userPhone ? `\n📱 Phone: ${reportData.userPhone}` : ''}\n📌 Subjek: ${reportData.subject}\n\n📄 Pesan:\n${reportData.message}`,
    metadata: {
      userName: reportData.userName,
      userEmail: reportData.userEmail,
      userPhone: reportData.userPhone,
      subject: reportData.subject,
      reportMessage: reportData.message,
    },
  };

  await telegramChannel.send(payload);
}