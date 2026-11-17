// Test script untuk verifikasi Telegram notification
// Jalankan dengan: npx tsx scripts/test-telegram-notification.ts

import { env } from '@/lib/env';
import { buildTelegramMessage } from '@/lib/notifications/telegram';
import type { NotificationPayload } from '@/lib/notifications/types';

console.log('=== Telegram Notification Config Test ===\n');

// Test env config
console.log('Environment Config:');
console.log(`  TELEGRAM_ENABLED: ${env.TELEGRAM_ENABLED}`);
console.log(`  TELEGRAM_BOT_TOKEN: ${env.TELEGRAM_BOT_TOKEN ? '***SET***' : 'NOT SET'}`);
console.log(`  TELEGRAM_ADMIN_CHAT_ID: ${env.TELEGRAM_ADMIN_CHAT_ID}`);
console.log(`  TELEGRAM_SENDER_NAME: ${env.TELEGRAM_SENDER_NAME}`);
console.log(`  APP_URL: ${env.APP_URL}`);
console.log('');

// Test message building
console.log('Message Building Tests:');

const testPayloads: NotificationPayload[] = [
  {
    userId: 'admin',
    type: 'USER_REGISTERED',
    title: '👤 User Baru Mendaftar',
    message: 'User baru telah mendaftar akun',
    metadata: {
      userName: 'Rian Pratama',
      userEmail: 'rian@example.com',
      userPhone: '081234567890',
      userAddress: 'Jl. Gatot Subroto No. 20, Jakarta Selatan',
    },
  },
  {
    userId: 'admin',
    type: 'NEW_ORDER_ADMIN',
    title: '📋 Service Request Baru',
    message: 'Pelanggan membuat permintaan servis baru SRV-2026-123456 untuk "Service Laptop".',
    link: '/admin/orders/order-123',
    metadata: {
      orderNumber: 'SRV-2026-123456',
      orderId: 'order-123',
      serviceName: 'Service Laptop',
    },
  },
  {
    userId: 'admin',
    type: 'PAYMENT_RECEIVED',
    title: '✅ Pembayaran Dikonfirmasi',
    message: 'Pembayaran Rp 500.000 via Bank Transfer untuk invoice INV-2026-123456-7890 telah dikonfirmasi.',
    link: '/admin/invoices',
    metadata: {
      invoiceNumber: 'INV-2026-123456-7890',
      orderNumber: 'SRV-2026-123456',
      total: 500000,
      paymentMethod: 'Bank Transfer',
    },
  },
  {
    userId: 'admin',
    type: 'USER_REPORT',
    title: '📝 Laporan / Keluhan Baru',
    message: 'Laporan baru dari user',
    metadata: {
      userName: 'Budi Santoso',
      userEmail: 'budi@example.com',
      userPhone: '082198765432',
      subject: 'Keluhan Service Lambat',
      reportMessage: 'Saya sudah menunggu 3 hari tapi belum ada kabar dari teknisi.',
    },
  },
];

testPayloads.forEach((payload, i) => {
  console.log(`\n--- Test ${i + 1}: ${payload.type} ---`);
  const message = buildTelegramMessage(payload);
  console.log(message);
  console.log('\n[Length:', message.length, 'chars]');
});

console.log('\n=== All Tests Passed ===');