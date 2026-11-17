import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';

const API_KEY = process.env.NVIDIA_API_KEY || '';
const API_BASE = 'https://integrate.api.nvidia.com/v1';

// TechCare IT Services scoped system prompt - updated per new rules
const DEFAULT_SYSTEM_PROMPT = `
Kamu adalah TechCare AI Assistant, asisten virtual yang terdapat di dalam aplikasi TechCare.

RUANG LINGKOP (SCOPE): AI ini hanya boleh merespons pertanyaan yang berkaitan dengan:
1. Fitur-fitur aplikasi TechCare IT Services
2. Menu-navigasi dalam aplikasi
3. Cara menggunakan aplikasi
4. Informasi yang tersedia di dalam aplikasi
5. Panduan penggunaan aplikasi

TIDAK BOLEH merespons:
- Pertanyaan tentang identitas personal AI (seperti "Siapa kamu?", "Kamu siapa?", "Apa nama kamu?")
- Pembuatan kode program, script, atau code apapun
- Pertanyaan yang tidak relevan dengan aplikasi TechCare IT Services
- Informasi luar jangkauan knowledge base aplikasi

ATURAN PERILAKU WAJIB:
1. BAGI TANYA IDENTITAS: Jika pengguna bertanya "siapa kamu", "siapa anda", "anda siapa", "kamu siapa", "apa nama kamu", atau "kamu AI apa", jawab dengan kalimat berikut:
   "Saya adalah TechCare AI Assistant, asisten virtual di aplikasi TechCare. Saya membantu Anda melakukan troubleshooting dasar, memahami layanan TechCare, dan mendapatkan panduan terkait masalah komputer atau laptop."
2. TIDAK BOLEH MEMBUAT KODE: Jika pengguna meminta Python, JavaScript, HTML, CSS, PHP, Java, C/C++, SQL, source code, script, code program lainnya, jawab:
   "Maaf, saya tidak dapat membuat atau memberikan kode program. Saya hanya dapat membantu mengenai aplikasi TechCare, layanan service, serta troubleshooting komputer dan laptop."
3. TUjuan LUAR JANGKAUAN: Jika pengguna bertanya tentang berita, cuaca, politik, olahraga, film, musik, resep, cerita, joke, atau hal umum, jawab:
   "Maaf, saya hanya dapat membantu mengenai aplikasi TechCare, layanan service, serta masalah komputer dan laptop."
4. BAHASA INDONESIA NATURAL: Gunakan bahasa Indonesia yang ramah, sopan, jelas, dan singkat.
5. JANGAN MENGARANG: Jangan mengarang harga, status service, data pelanggan, pesanan, garansi, jadwal teknisi, atau data lain yang tidak terdapat pada context/database.
6. PERTANYAAN DI LUAR KEMAMPUAN: Jika informasi tidak tersedia di knowledge base aplikasi, jawab dengan kalimat persis berikut:
   "Informasi tersebut belum tersedia. Saya sarankan menghubungi admin kami."

---

PETUNJUK UNTUK PROVIDER: System prompt di atas akan dimasukkan ke dalam pesan sistem saat memanggil NVIDIA LLM. Pastikan provider (atau fallback knowledge engine) juga mengikuti aturan serupa.

---`;

export async function POST(request: NextRequest) {
  try {
    // Wajib login - endpoint ini memanggil provider AI berbayar.
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Silakan login terlebih dahulu' },
        { status: 401 }
      );
    }

    const { message } = await request.json();

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Pesan kosong' },
        { status: 400 }
      );
    }

    // Batasi panjang pesan agar endpoint tidak disalahgunakan
    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Pesan terlalu panjang (maks 2000 karakter)' },
        { status: 422 }
      );
    }

    // Provider belum dikonfigurasi -> jangan panggil endpoint eksternal tanpa key
    if (!API_KEY) {
      return NextResponse.json(
        { response: 'Maaf, layanan AI belum dikonfigurasi di server. Silakan hubungi admin.' },
        { status: 503 }
      );
    }

    // System prompt TIDAK BOLEH dikendalikan dari client (mencegah abuse kuota & prompt injection).
    // Selalu gunakan prompt resmi server-side.
    const effectiveSystemPrompt = DEFAULT_SYSTEM_PROMPT;

    // Cek apakah pesan memerlukan penanganan khusus sebelum dikirim ke AI
    const lowerMessage = message.toLowerCase().trim();

    // 1. Cek identitas AI
    const identityPatterns = ['siapa kamu', 'kamu siapa', 'apa nama kamu', 'nama kamu siapa', 'who are you', 'what is your name'];
    const isIdentityQuery = identityPatterns.some(p => lowerMessage.includes(p));

    // 2. Cek permintaaan kode
    const codeKeywords = ['python', 'javascript', 'html', 'css', 'php', 'java', 'c/', 'c++', 'sql', 'source code', 'script', 'code', 'program', 'debug', 'debugging'];
    const hasCodeKeyword = codeKeywords.some(k => lowerMessage.includes(k));

    // 3. Cek topik luar jangkauan
    const appRelatedKeywords = ['fitur', 'menu', 'cara menggunakan', 'navigasi', 'informasi', 'panduan', 'aplikasi', 'techcare', 'layanan'];
    const isAppRelated = appRelatedKeywords.some(k => lowerMessage.includes(k));

    // Jika identitas AI -> tunjukkan respons khusus, lewati AI call
    if (isIdentityQuery) {
      return NextResponse.json({ response: 'Saya adalah TechCare AI Assistant, asisten virtual di aplikasi TechCare. Saya membantu Anda melakukan troubleshooting dasar, memahami layanan TechCare, dan mendapatkan panduan terkait masalah komputer atau laptop.' });
    }

    // Jika permintaaan kode -> tunjukkan respons khusus, lewati AI call
    if (hasCodeKeyword) {
      return NextResponse.json({ response: 'Maaf, saya tidak dapat membuat atau memberikan kode program. Saya hanya dapat membantu Anda menggunakan fitur dan layanan yang tersedia di aplikasi ini.' });
    }

    // Jika topik luar jangkauan aplikasi -> tunjukkan respons khusus
    // But only if it's clearly not about the app (not just "bagus" or generic)
    const nonAppGenericPatterns = ['berita', 'cuaca', 'politik', 'olahraga', 'film', 'musik', 'resep', 'cerita', 'joke', 'humor'];
    const isGenericNonApp = nonAppGenericPatterns.some(p => lowerMessage.includes(p));

    if (!isAppRelated && isGenericNonApp) {
      return NextResponse.json({ response: 'Maaf, saya hanya dapat membantu pertanyaan yang berkaitan dengan aplikasi ini. Silakan tanyakan mengenai fitur atau cara menggunakan aplikasi.' });
    }

    // Lewati cek lanjutan ke AI jika pesan masih kosong setelah filter
    if (!message.trim()) {
      return NextResponse.json({ response: 'Maaf, pesan tidak boleh kosong. Silakan tanyakan mengenai fitur atau cara menggunakan aplikasi.' });
    }

    // Kirim ke NVIDIA LLM dengan system prompt yang sudah dibatasi scope-nya
    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-super-120b-a12b',
        messages: [
          { role: 'system', content: effectiveSystemPrompt.trim() },
          { role: 'user', content: message },
        ],
        temperature: 0.5,
        top_p: 1,
        max_tokens: 1024,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('NVIDIA API Error:', errorData);
      return NextResponse.json(
        { response: 'Maaf, terjadi kesalahan saat menghubungi layanan AI. Silakan coba lagi nanti.' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'Maaf, saya tidak bisa merespons saat ini.';
    return NextResponse.json({ response: aiResponse });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { response: 'Maaf, terjadi kesalahan sistem. Silakan coba lagi nanti.' },
      { status: 500 }
    );
  }
}