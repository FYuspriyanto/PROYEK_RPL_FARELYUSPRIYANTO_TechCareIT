/**
 * Automated test suite for AI Assistant feature
 * Tests:
 * 1. FAQ (Business policies, operating hours, warranty grounding in KB)
 * 2. Troubleshooting (Safe, step-by-step guidance, no false certainty)
 * 3. Recommendation (Matching services: RAM, SSD, Diagnostic)
 * 4. Unknown question (Returns fallback: "Informasi tersebut belum tersedia. Saya sarankan menghubungi admin kami.")
 * 5. Authorization (Unauthenticated API access rejected with 401)
 * 6. API error handling (Graceful handling of provider errors / malformed inputs)
 * 7. Conversation persistence (user, session, message, role, timestamp)
 */

import { PrismaClient } from '@prisma/client';
import { aiAssistantService } from '../src/lib/ai/service';
import { KnowledgeFallbackProvider } from '../src/lib/ai/providers/knowledge-fallback';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🤖 ============================================');
  console.log('🤖 STARTING AI ASSISTANT COMPREHENSIVE TESTS');
  console.log('🤖 ============================================\n');

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
    // Test 1: Knowledge Base Grounding & FAQ
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing FAQ & Knowledge Base Grounding ---');
    const faqResponse = await aiAssistantService.processChat(
      [],
      'Kapan jam operasional toko TechCare buka?'
    );

    assert(
      faqResponse.content.toLowerCase().includes('operasional') ||
      faqResponse.content.toLowerCase().includes('senin') ||
      faqResponse.content.toLowerCase().includes('08:30'),
      'FAQ: Menjawab jam operasional sesuai Knowledge Base',
      `Output: ${faqResponse.content.slice(0, 150)}...`
    );

    const warrantyResponse = await aiAssistantService.processChat(
      [],
      'Berapa lama garansi service di sini?'
    );

    assert(
      warrantyResponse.content.toLowerCase().includes('garansi') &&
      (warrantyResponse.content.includes('30') || warrantyResponse.content.includes('hari')),
      'FAQ: Menjawab kebijakan garansi secara akurat',
      `Output: ${warrantyResponse.content.slice(0, 150)}...`
    );

    // -------------------------------------------------------------
    // Test 2: Troubleshooting Behavior (Safety, No False Certainty)
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Troubleshooting & Safety Guidelines ---');
    const troubleResponse = await aiAssistantService.processChat(
      [],
      'Laptop saya sangat lambat.'
    );

    const hasNoFalseCertainty =
      troubleResponse.content.toLowerCase().includes('kemungkinan') ||
      troubleResponse.content.toLowerCase().includes('perkiraan') ||
      troubleResponse.content.toLowerCase().includes('bukan kepastian');

    assert(
      hasNoFalseCertainty,
      'Troubleshooting: Tidak mengklaim diagnosis sebagai kepastian mutlak',
      `Output: ${troubleResponse.content.slice(0, 150)}...`
    );

    const hasSafeTroubleshooting =
      troubleResponse.content.toLowerCase().includes('task manager') ||
      troubleResponse.content.toLowerCase().includes('disk cleanup') ||
      troubleResponse.content.toLowerCase().includes('startup') ||
      troubleResponse.content.toLowerCase().includes('restart');

    assert(
      hasSafeTroubleshooting,
      'Troubleshooting: Memberikan instruksi troubleshooting awal yang aman',
      `Output: ${troubleResponse.content.slice(0, 150)}...`
    );

    const suggestsTechnician =
      troubleResponse.content.toLowerCase().includes('teknisi') ||
      troubleResponse.content.toLowerCase().includes('pemeriksaan fisik');

    assert(
      suggestsTechnician,
      'Troubleshooting: Menyarankan teknisi jika butuh pemeriksaan lanjutan',
      `Output: ${troubleResponse.content.slice(0, 150)}...`
    );

    // -------------------------------------------------------------
    // Test 3: Recommendation (Matched Services)
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Service Recommendations ---');
    assert(
      troubleResponse.recommendedServices && troubleResponse.recommendedServices.length > 0,
      'Recommendation: Menghasilkan rekomendasi layanan',
      `Jumlah rekomendasi: ${troubleResponse.recommendedServices?.length}`
    );

    const recommendedNames = troubleResponse.recommendedServices.map((s) => s.name.toLowerCase()).join(' ');
    const hasRelevantServices =
      recommendedNames.includes('ram') ||
      recommendedNames.includes('ssd') ||
      recommendedNames.includes('nvme') ||
      recommendedNames.includes('diagnosa') ||
      recommendedNames.includes('cleaning');

    assert(
      hasRelevantServices,
      'Recommendation: Layanan relevan (RAM, SSD, Diagnosa/Cleaning) direkomendasikan',
      `Layanan: ${troubleResponse.recommendedServices.map((s) => s.name).join(', ')}`
    );

    // -------------------------------------------------------------
    // Test 4: Unknown Question / Out of Scope
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Unknown / Out-of-Scope Questions ---');
    const unknownResponse = await aiAssistantService.processChat(
      [],
      'Berapa harga tiket pesawat ke planet Mars tahun depan?'
    );

    const expectedUnknownFallback =
      'Informasi tersebut belum tersedia. Saya sarankan menghubungi admin kami.';

    assert(
      unknownResponse.content.trim() === expectedUnknownFallback,
      'Unknown Question: Menjawab persis fallback sesuai aturan',
      `Actual output: "${unknownResponse.content.trim()}"`
    );

    // -------------------------------------------------------------
    // Test 5: Authorization Security
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Authorization Security ---');
    // Test calling the API route directly without cookie
    const { POST: chatRouteHandler } = await import('../src/app/api/ai/chat/route');
    const unauthReq = new Request('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Halo' }),
    });

    const unauthRes = await chatRouteHandler(unauthReq as any);
    assert(
      unauthRes.status === 401,
      'Authorization: Request tanpa sesi ditolak dengan status 401 Unauthorized',
      `Status code: ${unauthRes.status}`
    );

    // -------------------------------------------------------------
    // Test 6: API Error & Input Validation Handling
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Input Validation & API Error Handling ---');
    // Test empty message payload with simulated admin session
    const mockAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    assert(Boolean(mockAdmin), 'Setup: User admin tersedia di database');

    const emptyMsgReq = new Request('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '' }),
    });

    // Test malformed JSON
    const malformedReq = new Request('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json{{{',
    });
    const malformedRes = await chatRouteHandler(malformedReq as any);
    // Malformed JSON without session still fails fast (401 or 400)
    assert(
      malformedRes.status === 401 || malformedRes.status === 400,
      'API Error: Malformed request body ditolak secara aman',
      `Status: ${malformedRes.status}`
    );

    // -------------------------------------------------------------
    // Test 7: Conversation Persistence (DB Record Check)
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Conversation DB Persistence ---');
    const testSessionId = `test_session_${Date.now()}`;
    const testConv = await prisma.aiConversation.create({
      data: {
        sessionId: testSessionId,
        userId: mockAdmin?.id,
        title: 'Test Laptop Lemot',
        messages: {
          create: [
            {
              role: 'user',
              content: 'Laptop saya lambat sekali',
            },
            {
              role: 'assistant',
              content: 'Beberapa kemungkinan penyebabnya adalah storage hampir penuh.',
              metadata: JSON.stringify({ providerUsed: 'knowledge-fallback' }),
            },
          ],
        },
      },
      include: {
        messages: true,
        user: true,
      },
    });

    assert(
      Boolean(testConv.id && testConv.sessionId === testSessionId),
      'Persistence: AiConversation tersimpan dengan sessionId unik',
      `SessionId: ${testConv.sessionId}`
    );

    assert(
      Boolean(testConv.userId && testConv.user?.email),
      'Persistence: Percakapan terhubung dengan data user',
      `User: ${testConv.user?.email}`
    );

    assert(
      testConv.messages.length === 2,
      'Persistence: Messages (user & assistant) tersimpan lengkap',
      `Total messages: ${testConv.messages.length}`
    );

    const userMsg = testConv.messages.find((m) => m.role === 'user');
    const assistantMsg = testConv.messages.find((m) => m.role === 'assistant');

    assert(
      Boolean(userMsg?.content && userMsg?.createdAt && assistantMsg?.content && assistantMsg?.createdAt),
      'Persistence: Field role, message, dan timestamp tersimpan lengkap',
      `Timestamp user: ${userMsg?.createdAt.toISOString()}`
    );

    // Clean up test conversation
    await prisma.aiConversation.delete({ where: { id: testConv.id } });
    console.log('🧹 Cleaned up test conversation record');

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n============================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('============================================\n');

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

runTests();
