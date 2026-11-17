import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Check if configs already exist
  const existing = await prisma.aiConfig.count();
  if (existing > 0) {
    console.log(`AI configs already exist (${existing} records). Skipping seed.`);
    return;
  }

  // Seed NVIDIA (primary & active since .env has NVIDIA_API_KEY)
  await prisma.aiConfig.create({
    data: {
      providerName: 'NVIDIA',
      providerSlug: 'nvidia',
      apiKey: process.env.NVIDIA_API_KEY || '',
      model: process.env.NVIDIA_MODEL || 'nvidia/nemotron-3-super-120b-a12b',
      baseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
      isActive: Boolean(process.env.NVIDIA_API_KEY),
      isPrimary: true,
      maxTokens: 1200,
      temperature: 0.3,
      timeoutMs: 30000,
      notes: 'NVIDIA NIM API — default provider',
    },
  });
  console.log('✅ Seeded NVIDIA AI config');

  // Seed Gemini (inactive placeholder)
  await prisma.aiConfig.create({
    data: {
      providerName: 'Google Gemini',
      providerSlug: 'gemini',
      apiKey: process.env.GEMINI_API_KEY || '',
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      isActive: Boolean(process.env.GEMINI_API_KEY),
      isPrimary: false,
      maxTokens: 1200,
      temperature: 0.3,
      timeoutMs: 20000,
      notes: 'Google Gemini API — fallback / alternatif provider',
    },
  });
  console.log('✅ Seeded Gemini AI config');

  console.log('🎉 AI config seeding complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());

