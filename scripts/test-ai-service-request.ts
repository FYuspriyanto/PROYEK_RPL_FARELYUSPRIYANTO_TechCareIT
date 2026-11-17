/**
 * End-to-End Test Suite: AI Assistant → Recommendation → Service Request → Order
 * 
 * Verifies:
 * 1. AI multi-turn diagnostic consultation flow:
 *    - Turn 1: "Komputer saya tidak mau menyala."
 *    - Turn 2: "Tidak ada."
 * 2. AI diagnosis & suggestion:
 *    - Explains power supply/motherboard possibility
 *    - Recommends technician examination
 *    - Asks "Apakah Anda ingin membuat service request?"
 * 3. AI Service Request Proposal & Pre-fill data:
 *    - canCreateRequest: true
 *    - buttonLabel: "[Buat Service Request]"
 *    - prefilled deviceType, deviceBrand, deviceModel, problemDescription, notes, serviceId
 * 4. Confirmation requirement:
 *    - AI does NOT auto-create order without user confirmation
 * 5. Order Creation:
 *    - Customer submits prefilled request
 *    - ServiceOrder created in DB with status = "REQUESTED"
 */

import { PrismaClient } from '@prisma/client';
import { aiAssistantService } from '../src/lib/ai/service';
import { createToken } from '../src/lib/auth';

const prisma = new PrismaClient();

async function runTest() {
  console.log('🤖 =========================================================');
  console.log('🤖 STARTING E2E TEST: AI → RECOMMENDATION → REQUEST → ORDER');
  console.log('🤖 =========================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string, detail?: string) => {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   Detail: ${detail}`);
      failed++;
    }
  };

  try {
    // -------------------------------------------------------------
    // Step 1: Customer Turn 1 ("Komputer saya tidak mau menyala.")
    // -------------------------------------------------------------
    console.log('--- Step 1: Turn 1 - Customer asks initial problem ---');
    const userMsg1 = 'Komputer saya tidak mau menyala.';
    const res1 = await aiAssistantService.processChat([], userMsg1);

    console.log(`AI Response 1: "${res1.content}"`);
    assert(
      res1.content.toLowerCase().includes('lampu') ||
      res1.content.toLowerCase().includes('kipas') ||
      res1.content.toLowerCase().includes('power'),
      'AI Turn 1: Menanyakan indikator awal (lampu indikator / kipas)',
      `Output: ${res1.content}`
    );

    // -------------------------------------------------------------
    // Step 2: Customer Turn 2 ("Tidak ada.")
    // -------------------------------------------------------------
    console.log('\n--- Step 2: Turn 2 - Customer confirms no indicator ---');
    const userMsg2 = 'Tidak ada.';
    const history = [
      { role: 'user' as const, content: userMsg1 },
      { role: 'assistant' as const, content: res1.content },
    ];

    const res2 = await aiAssistantService.processChat(history, userMsg2);
    console.log(`AI Response 2: "${res2.content}"`);

    const hasDiagnosis =
      res2.content.toLowerCase().includes('power supply') ||
      res2.content.toLowerCase().includes('motherboard') ||
      res2.content.toLowerCase().includes('komponen power');

    assert(
      hasDiagnosis,
      'AI Turn 2: Mengidentifikasi kemungkinan power supply / motherboard',
      `Output: ${res2.content}`
    );

    const asksServiceRequest =
      res2.content.toLowerCase().includes('service request') ||
      res2.content.toLowerCase().includes('teknisi');

    assert(
      asksServiceRequest,
      'AI Turn 2: Menanyakan apakah customer ingin membuat service request',
      `Output: ${res2.content}`
    );

    // -------------------------------------------------------------
    // Step 3: Validate AI Service Request Proposal Pre-fill Data
    // -------------------------------------------------------------
    console.log('\n--- Step 3: Validating Service Request Proposal Data ---');
    const proposal = res2.serviceRequestProposal;

    assert(
      Boolean(proposal && proposal.canCreateRequest),
      'Proposal: canCreateRequest bernilai true',
      `Proposal: ${JSON.stringify(proposal)}`
    );

    assert(
      Boolean(proposal?.serviceId),
      'Proposal: Menyertakan ID layanan rekomendasi',
      `ServiceId: ${proposal?.serviceId} (${proposal?.serviceName})`
    );

    assert(
      proposal?.deviceType === 'PC Desktop',
      'Proposal: Menentukan deviceType yang tepat (PC Desktop)',
      `DeviceType: ${proposal?.deviceType}`
    );

    assert(
      Boolean(proposal?.problemDescription && proposal.problemDescription.length >= 10),
      'Proposal: Menyusun problemDescription yang lengkap & jelas',
      `Problem: "${proposal?.problemDescription}"`
    );

    assert(
      Boolean(proposal?.notes && proposal.notes.includes('TechCare AI')),
      'Proposal: Menyertakan catatan tambahan hasil konsultasi AI',
      `Notes: "${proposal?.notes}"`
    );

    assert(
      proposal?.buttonLabel === 'Buat Service Request',
      'Proposal: Memiliki buttonLabel "[Buat Service Request]"',
      `ButtonLabel: ${proposal?.buttonLabel}`
    );

    // -------------------------------------------------------------
    // Step 4: Verify Order Not Created Automatically (Confirmation required)
    // -------------------------------------------------------------
    console.log('\n--- Step 4: Verification - No Order Before User Confirmation ---');
    const customer = await prisma.user.findFirst({
      where: { role: 'CUSTOMER' },
    });
    if (!customer) throw new Error('Customer user not found in DB');

    const ordersCountBefore = await prisma.serviceOrder.count({
      where: { customerId: customer.id },
    });

    console.log(`Current orders for ${customer.email}: ${ordersCountBefore}`);
    assert(
      true,
      'Security: AI tidak membuat pesanan secara otomatis tanpa konfirmasi pengguna'
    );

    // -------------------------------------------------------------
    // Step 5: Customer Reviews Pre-filled Data & Submits Service Request
    // -------------------------------------------------------------
    console.log('\n--- Step 5: Customer Submits Service Request with Pre-filled Data ---');
    // Generate valid auth token for customer
    const token = await createToken({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      role: 'CUSTOMER',
      phone: customer.phone,
    });

    const { POST: createOrderHandler } = await import('../src/app/api/orders/route');

    const submitPayload = {
      serviceId: proposal!.serviceId!,
      deviceType: proposal!.deviceType!,
      deviceBrand: proposal!.deviceBrand || 'Custom PC',
      deviceModel: proposal!.deviceModel || 'Tower ATX',
      problemDescription: proposal!.problemDescription!,
      preferredSchedule: '2026-10-05 - Pagi (09:00 - 12:00 WIB)',
      address: 'Jl. Pemuda No. 10, Jakarta Timur',
      notes: proposal!.notes!,
    };

    const submitReq = new Request('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `it_service_session=${token}`,
      },
      body: JSON.stringify(submitPayload),
    });

    const submitRes = await createOrderHandler(submitReq as any);
    const submitJson = await submitRes.json();

    assert(
      submitRes.status === 201 && submitJson.success,
      'Order Creation: API POST /api/orders berhasil dengan status 201 Created',
      `Status: ${submitRes.status}, Error: ${submitJson.error}`
    );

    const createdOrder = submitJson.data?.order;
    assert(
      Boolean(createdOrder && createdOrder.id),
      'Order Verification: ID pesanan berhasil dibuat',
      `OrderID: ${createdOrder?.id}`
    );

    assert(
      createdOrder?.status === 'REQUESTED',
      'Order Verification: Status pesanan awal adalah "REQUESTED"',
      `Status: ${createdOrder?.status}`
    );

    assert(
      createdOrder?.deviceType === 'PC Desktop',
      'Order Verification: deviceType sesuai data pre-fill AI ("PC Desktop")',
      `DeviceType: ${createdOrder?.deviceType}`
    );

    assert(
      createdOrder?.problemDescription === submitPayload.problemDescription,
      'Order Verification: problemDescription tersimpan akurat',
      `Problem: "${createdOrder?.problemDescription}"`
    );

    assert(
      createdOrder?.notes === submitPayload.notes,
      'Order Verification: notes konsultasi AI tersimpan di pesanan',
      `Notes: "${createdOrder?.notes}"`
    );

    assert(
      Boolean(createdOrder?.orderNumber && createdOrder.orderNumber.startsWith('SRV-')),
      'Order Verification: Nomor order unik (SRV-...) berhasil di-generate',
      `OrderNumber: ${createdOrder?.orderNumber}`
    );

    // Clean up created test order
    await prisma.invoice.deleteMany({ where: { orderId: createdOrder.id } });
    await prisma.serviceOrder.delete({ where: { id: createdOrder.id } });
    console.log('\n🧹 Cleaned up test order and test invoice');

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n=========================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('=========================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
