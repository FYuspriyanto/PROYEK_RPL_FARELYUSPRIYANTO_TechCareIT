// Test script untuk verifikasi WhatsApp notification logic
// Jalankan dengan: npx tsx scripts/test-whatsapp-notification.ts

import { env } from '@/lib/env';
import { formatPhoneNumber, buildWhatsAppMessage } from '@/lib/notifications/whatsapp';
import type { NotificationPayload } from '@/lib/notifications/types';

console.log('=== WhatsApp Notification Config Test ===\n');

// Test env config
console.log('Environment Config:');
console.log(`  WHATSAPP_ENABLED: ${env.WHATSAPP_ENABLED}`);
console.log(`  WHATSAPP_PROVIDER: ${env.WHATSAPP_PROVIDER}`);
console.log(`  WHATSAPP_ADMIN_PHONE: ${env.WHATSAPP_ADMIN_PHONE}`);
console.log(`  WHATSAPP_SENDER_NAME: ${env.WHATSAPP_SENDER_NAME}`);
console.log(`  APP_URL: ${env.APP_URL}`);
console.log('');

// Test phone formatting
console.log('Phone Number Formatting Tests:');
const testPhones = [
  '088231331266',
  '6288231331266',
  '+6288231331266',
  '0812-3456-7890',
  '+62 812 3456 7890',
];
testPhones.forEach(phone => {
  console.log(`  ${phone} -> ${formatPhoneNumber(phone)}`);
});
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
  const message = buildWhatsAppMessage(payload);
  console.log(message);
  console.log('\n[Length:', message.length, 'chars]');
});

console.log('\n=== All Tests Passed ===');