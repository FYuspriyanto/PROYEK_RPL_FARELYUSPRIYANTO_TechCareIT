/**
 * Automated verification for ROLE-BASED database access in the AI Assistant.
 *
 * Memastikan:
 * - GUEST hanya melihat data publik (tidak ada data pribadi/bisnis).
 * - CUSTOMER hanya melihat data miliknya sendiri (tidak ada metrik bisnis internal / data customer lain).
 * - ADMIN dapat melihat statistik bisnis global (pendapatan, pelanggan, pesanan terbaru, invoice unpaid).
 * - Fallback provider menolak pertanyaan data internal untuk non-admin.
 *
 * Jalankan: npx tsx scripts/verify-ai-role-access.ts
 */

import { PrismaClient } from '@prisma/client';
import {
  buildDatabaseContext,
  formatDatabaseContextForPrompt,
} from '../src/lib/ai/db-context';
import { aiAssistantService } from '../src/lib/ai/service';

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

const assert = (condition: boolean, testName: string, detail?: string) => {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    if (detail) console.error(`   Detail: ${detail}`);
    failed++;
  }
};

const FORBIDDEN_INTERNAL_MARKERS = [
  'Total Pelanggan Terdaftar',
  'Total Pesanan Sistem',
  'Breakdown per Status',
  'Total Pendapatan (Invoice PAID)',
  'PESANAN TERBARU SISTEM',
  'STATISTIK BISNIS & SISTEM ADMIN',
  'MENUNGGU APPROVAL',
];

async function runTests() {
  console.log('========================================');
  console.log('AI ROLE-BASED DATABASE ACCESS - VERIFY');
  console.log('========================================\n');

  const admin = await prisma.user.findUnique({ where: { email: 'admin@techcare.id' } });
  const budi = await prisma.user.findUnique({ where: { email: 'budi@gmail.com' } });

  if (!admin || !budi) {
    console.error('User demo tidak ditemukan. Jalankan: npm run db:seed');
    process.exit(1);
  }

  // Hitung ekspektasi dari database agar tidak bergantung pada angka seed
  const expectedCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
  const paidAgg = await prisma.invoice.aggregate({
    _sum: { total: true },
    where: { paymentStatus: 'PAID' },
  });
  const expectedRevenue = `Rp ${Math.round(paidAgg._sum.total || 0).toLocaleString('id-ID')}`;

  // -------------------------------------------------------------
  // 1. GUEST (belum login)
  // -------------------------------------------------------------
  const guestCtx = await buildDatabaseContext();
  const guestText = formatDatabaseContextForPrompt(guestCtx);

  assert(guestCtx.role === 'GUEST', 'GUEST: role = GUEST');
  assert(guestText.includes('AKSES TAMU'), 'GUEST: prompt mencantumkan cakupan tamu');
  assert(guestText.includes('LAYANAN'), 'GUEST: bisa melihat katalog layanan publik');
  assert(!guestText.includes('Nama Pelanggan'), 'GUEST: tidak ada profil pelanggan');
  assert(!guestText.includes('SRV-2026'), 'GUEST: tidak ada nomor pesanan apa pun');
  for (const marker of FORBIDDEN_INTERNAL_MARKERS) {
    assert(!guestText.includes(marker), `GUEST: tidak ada marker internal "${marker}"`);
  }

  // -------------------------------------------------------------
  // 2. CUSTOMER (budi)
  // -------------------------------------------------------------
  const custCtx = await buildDatabaseContext(budi.id);
  const custText = formatDatabaseContextForPrompt(custCtx);

  assert(custCtx.role === 'CUSTOMER', 'CUSTOMER: role = CUSTOMER');
  assert(custText.includes('budi@gmail.com'), 'CUSTOMER: profil sendiri termuat');
  assert(custText.includes('SRV-2026-0001'), 'CUSTOMER: pesanan sendiri (SRV-2026-0001) termuat');
  assert(custText.includes('SRV-2026-0002'), 'CUSTOMER: pesanan sendiri (SRV-2026-0002) termuat');
  assert(!custText.includes('SRV-2026-0004'), 'CUSTOMER: pesanan customer LAIN (siti, SRV-2026-0004) TIDAK termuat');
  assert(!custText.includes('SRV-2026-0005'), 'CUSTOMER: pesanan customer LAIN (hendra, SRV-2026-0005) TIDAK termuat');
  for (const marker of FORBIDDEN_INTERNAL_MARKERS) {
    assert(!custText.includes(marker), `CUSTOMER: tidak ada marker internal "${marker}"`);
  }
  assert(custCtx.raw?.totalRevenue === undefined, 'CUSTOMER: totalRevenue tidak dihitung (undefined)');
  assert(custCtx.raw?.totalCustomers === undefined, 'CUSTOMER: totalCustomers tidak dihitung (undefined)');
  assert(custCtx.raw?.totalOrders === undefined, 'CUSTOMER: totalOrders tidak dihitung (undefined)');
  assert(custCtx.raw?.totalInvoicesUnpaid === undefined, 'CUSTOMER: totalInvoicesUnpaid tidak dihitung (undefined)');

  // -------------------------------------------------------------
  // 3. ADMIN
  // -------------------------------------------------------------
  const admCtx = await buildDatabaseContext(admin.id);
  const admText = formatDatabaseContextForPrompt(admCtx);

  assert(admCtx.role === 'ADMIN', 'ADMIN: role = ADMIN');
  assert(admText.includes('AKSES ADMIN'), 'ADMIN: prompt mencantumkan cakupan admin');
  assert(admText.includes('STATISTIK BISNIS'), 'ADMIN: statistik bisnis termuat');
  assert(admText.includes('Total Pelanggan Terdaftar'), 'ADMIN: total pelanggan termuat');
  assert(admText.includes('Total Pendapatan'), 'ADMIN: total pendapatan termuat');
  assert(admText.includes('SRV-2026-0004'), 'ADMIN: pesanan customer lain (siti) termuat');
  assert(admText.includes('SRV-2026-0005'), 'ADMIN: pesanan customer lain (hendra) termuat');
  assert((admCtx.raw?.totalRevenue ?? -1) >= 0, 'ADMIN: totalRevenue dihitung');
  assert((admCtx.raw?.totalOrders ?? 0) > 0, 'ADMIN: totalOrders dihitung');
  assert((admCtx.raw?.recentOrders?.length ?? 0) > 0, 'ADMIN: daftar pesanan terbaru termuat');

  // -------------------------------------------------------------
  // 4. Fallback provider: customer ditolak untuk data internal
  // -------------------------------------------------------------
  const custRevenue = await aiAssistantService.processChat([], 'berapa total pendapatan perusahaan?', budi.id);
  assert(
    /hanya dapat diakses oleh admin|akses.*admin/i.test(custRevenue.content),
    'CUSTOMER ditolak saat tanya total pendapatan perusahaan',
    custRevenue.content
  );
  assert(!custRevenue.content.includes('100.000'), 'CUSTOMER: jawaban tidak memuat angka pendapatan internal');

  const custCustomers = await aiAssistantService.processChat([], 'berapa total pelanggan terdaftar?', budi.id);
  assert(
    /hanya dapat diakses oleh admin/i.test(custCustomers.content),
    'CUSTOMER ditolak saat tanya total pelanggan terdaftar',
    custCustomers.content
  );

  const custLatest = await aiAssistantService.processChat([], 'tampilkan pesanan terbaru', budi.id);
  assert(
    /hanya dapat diakses oleh admin/i.test(custLatest.content),
    'CUSTOMER ditolak saat tanya pesanan terbaru sistem',
    custLatest.content
  );

  const custOwnOrder = await aiAssistantService.processChat([], 'apa status pesanan saya?', budi.id);
  assert(custOwnOrder.content.includes('SRV-2026-0001') || custOwnOrder.content.includes('SRV-2026-0002'),
    'CUSTOMER: boleh melihat status pesanan SENDIRI',
    custOwnOrder.content
  );
  assert(!custOwnOrder.content.includes('SRV-2026-0004'),
    'CUSTOMER: jawaban pesanan sendiri tidak memuat pesanan customer lain'
  );

  // -------------------------------------------------------------
  // 5. Fallback provider: admin diberi jawaban data internal
  // -------------------------------------------------------------
  const admRevenue = await aiAssistantService.processChat([], 'berapa total pendapatan?', admin.id);
  assert(admRevenue.content.includes('Pendapatan') || admRevenue.content.includes('pendapatan'),
    'ADMIN: menjawab pertanyaan total pendapatan',
    admRevenue.content
  );
  assert(admRevenue.content.includes(expectedRevenue.replace('Rp ', '')),
    `ADMIN: angka pendapatan PAID sesuai database (${expectedRevenue})`,
    admRevenue.content
  );

  const admLatest = await aiAssistantService.processChat([], 'pesanan terbaru', admin.id);
  assert(admLatest.content.includes('SRV-2026-0005'),
    'ADMIN: menjawab pesanan terbaru sistem (SRV-2026-0005)',
    admLatest.content
  );

  const admUnpaid = await aiAssistantService.processChat([], 'invoice belum dibayar', admin.id);
  assert(admUnpaid.content.includes('INV-2026'),
    'ADMIN: menjawab daftar invoice belum dibayar',
    admUnpaid.content
  );

  const admCustomers = await aiAssistantService.processChat([], 'berapa total pelanggan terdaftar?', admin.id);
  assert(/pelanggan/i.test(admCustomers.content) && admCustomers.content.includes(String(expectedCustomers)),
    `ADMIN: menjawab total pelanggan terdaftar (terdaftar: ${expectedCustomers})`,
    admCustomers.content
  );

  // -------------------------------------------------------------
  // 6. GUEST end-to-end
  // -------------------------------------------------------------
  const guestPersonal = await aiAssistantService.processChat([], 'apa status pesanan saya?');
  assert(
    /login/i.test(guestPersonal.content),
    'GUEST: diminta login saat tanya data pribadi',
    guestPersonal.content
  );
  assert(!guestPersonal.content.includes('SRV-2026'), 'GUEST: tidak ada data pesanan yang bocor');

  const guestMetrics = await aiAssistantService.processChat([], 'berapa total pendapatan?');
  assert(
    !guestMetrics.content.includes('100.000') && !guestMetrics.content.includes('Total Pendapatan'),
    'GUEST: tidak ada data pendapatan internal yang bocor',
    guestMetrics.content
  );

  console.log('\n========================================');
  console.log(`HASIL: ${passed} passed, ${failed} failed`);
  console.log('========================================');

  await prisma.$disconnect();
  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch(async (err) => {
  console.error('Test runner error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
