// =============================================
// WhatsApp Notification Channel
// Supports multiple providers: generic HTTP, Fonnte, Wablas, WhatsApp Business API
// =============================================

import { env } from '@/lib/env';
import type { NotificationPayload, NotificationChannel } from './types';

// Format phone number to 62xxx format
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('+62')) {
    cleaned = cleaned.slice(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

// Build message template based on notification type
export function buildWhatsAppMessage(payload: NotificationPayload): string {
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
    // Custom types for user registration, etc.
    case 'USER_REGISTERED':
      emoji = '👤';
      break;
    case 'USER_REPORT':
      emoji = '📝';
      break;
  }

  const lines = [
    `${emoji} *${env.WHATSAPP_SENDER_NAME} - Notifikasi Admin*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `*${payload.title}*`,
    ``,
    payload.message,
    ``,
    `🕐 ${timestamp}`,
  ];

  // Add metadata info if available
  if (payload.metadata) {
    const meta = payload.metadata as Record<string, unknown>;
    if (meta.orderNumber) lines.push(`📦 Order: ${meta.orderNumber}`);
    if (meta.invoiceNumber) lines.push(`🧾 Invoice: ${meta.invoiceNumber}`);
    if (meta.total !== undefined) lines.push(`💵 Total: Rp ${Number(meta.total).toLocaleString('id-ID')}`);
    if (meta.customerName) lines.push(`👤 Customer: ${meta.customerName}`);
    if (meta.customerEmail) lines.push(`📧 Email: ${meta.customerEmail}`);
    if (meta.customerPhone) lines.push(`📱 Phone: ${meta.customerPhone}`);
    if (meta.userName) lines.push(`👤 Nama: ${meta.userName}`);
    if (meta.userEmail) lines.push(`📧 Email: ${meta.userEmail}`);
    if (meta.userPhone) lines.push(`📱 Phone: ${meta.userPhone}`);
  }

  if (payload.link) {
    const fullLink = `${env.APP_URL}${payload.link}`;
    lines.push(``, `🔗 Detail: ${fullLink}`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`_Pesan otomatis dari sistem_`);

  return lines.join('\n');
}

// Generic HTTP POST sender
async function sendGenericWhatsApp(phone: string, message: string): Promise<boolean> {
  if (!env.WHATSAPP_API_URL || !env.WHATSAPP_API_KEY) {
    console.warn('[WhatsApp] API URL or API Key not configured');
    return false;
  }

  try {
    const response = await fetch(env.WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.WHATSAPP_API_KEY}`,
      },
      body: JSON.stringify({
        target: phone,
        message,
        senderName: env.WHATSAPP_SENDER_NAME,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WhatsApp] Send failed:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('[WhatsApp] Sent successfully:', result);
    return true;
  } catch (error) {
    console.error('[WhatsApp] Send error:', error);
    return false;
  }
}

// Fonnte provider (popular in Indonesia)
async function sendFonnteWhatsApp(phone: string, message: string): Promise<boolean> {
  if (!env.WHATSAPP_API_KEY) {
    console.warn('[WhatsApp/Fonnte] API Key not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': env.WHATSAPP_API_KEY,
      },
      body: JSON.stringify({
        target: phone,
        message,
        countryCode: '62',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WhatsApp/Fonnte] Send failed:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('[WhatsApp/Fonnte] Sent successfully:', result);
    return result.status === true;
  } catch (error) {
    console.error('[WhatsApp/Fonnte] Send error:', error);
    return false;
  }
}

// Wablas provider (popular in Indonesia)
async function sendWablasWhatsApp(phone: string, message: string): Promise<boolean> {
  if (!env.WHATSAPP_API_URL || !env.WHATSAPP_API_KEY) {
    console.warn('[WhatsApp/Wablas] API URL or Token not configured');
    return false;
  }

  try {
    const response = await fetch(`${env.WHATSAPP_API_URL}/api/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.WHATSAPP_API_KEY}`,
      },
      body: JSON.stringify({
        phone,
        message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WhatsApp/Wablas] Send failed:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('[WhatsApp/Wablas] Sent successfully:', result);
    return result.status === 'success';
  } catch (error) {
    console.error('[WhatsApp/Wablas] Send error:', error);
    return false;
  }
}

// WhatsApp Business API (official Meta)
async function sendWhatsAppBusinessAPI(phone: string, message: string): Promise<boolean> {
  if (!env.WHATSAPP_API_URL || !env.WHATSAPP_API_KEY) {
    console.warn('[WhatsApp/Business] API URL or Token not configured');
    return false;
  }

  try {
    // Expected format: https://graph.facebook.com/v18.0/{phone-number-id}/messages
    const response = await fetch(env.WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.WHATSAPP_API_KEY}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WhatsApp/Business] Send failed:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('[WhatsApp/Business] Sent successfully:', result);
    return true;
  } catch (error) {
    console.error('[WhatsApp/Business] Send error:', error);
    return false;
  }
}

// Main WhatsApp channel implementation
export const whatsappChannel: NotificationChannel = {
  name: 'whatsapp',
  async send(payload: NotificationPayload) {
    if (!env.WHATSAPP_ENABLED) {
      console.log('[WhatsApp] Disabled, skipping');
      return;
    }

    const adminPhone = formatPhoneNumber(env.WHATSAPP_ADMIN_PHONE);
    const message = buildWhatsAppMessage(payload);

    let success = false;

    switch (env.WHATSAPP_PROVIDER) {
      case 'fonnte':
        success = await sendFonnteWhatsApp(adminPhone, message);
        break;
      case 'wablas':
        success = await sendWablasWhatsApp(adminPhone, message);
        break;
      case 'whatsapp_business':
        success = await sendWhatsAppBusinessAPI(adminPhone, message);
        break;
      case 'generic':
      default:
        success = await sendGenericWhatsApp(adminPhone, message);
        break;
    }

    if (!success) {
      console.error(`[WhatsApp] Failed to send notification type: ${payload.type}`);
    }
  },
};

// Helper to send custom WhatsApp message directly to admin
export async function sendAdminWhatsAppDirect(message: string): Promise<boolean> {
  if (!env.WHATSAPP_ENABLED) {
    console.log('[WhatsApp] Disabled, skipping direct send');
    return false;
  }

  const adminPhone = formatPhoneNumber(env.WHATSAPP_ADMIN_PHONE);

  switch (env.WHATSAPP_PROVIDER) {
    case 'fonnte':
      return sendFonnteWhatsApp(adminPhone, message);
    case 'wablas':
      return sendWablasWhatsApp(adminPhone, message);
    case 'whatsapp_business':
      return sendWhatsAppBusinessAPI(adminPhone, message);
    case 'generic':
    default:
      return sendGenericWhatsApp(adminPhone, message);
  }
}

// Helper to send user registration notification
export async function notifyUserRegistered(userData: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}): Promise<void> {
  const payload: NotificationPayload = {
    userId: 'admin', // dummy, not used for WhatsApp
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

  await whatsappChannel.send(payload);
}

// Helper to send user report/complaint notification
export async function notifyUserReport(reportData: {
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

  await whatsappChannel.send(payload);
}