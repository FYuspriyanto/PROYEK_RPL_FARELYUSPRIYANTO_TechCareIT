import os

from openai import OpenAI

# API credentials diambil dari environment variable, JANGAN di-hardcode di source code.
# Jalankan: $env:NVIDIA_API_KEY="nvapi-..."  (PowerShell) atau set di .env
API_BASE_URL = "https://integrate.api.nvidia.com/v1"
API_KEY = os.environ.get("NVIDIA_API_KEY", "")

if not API_KEY:
    raise RuntimeError(
        "NVIDIA_API_KEY belum diset. Set environment variable NVIDIA_API_KEY terlebih dahulu "
        "(jangan menuliskan API key langsung di dalam source code)."
    )

client = OpenAI(
    base_url=API_BASE_URL,
    api_key=API_KEY
)

# TechCare IT Services knowledge base - scope limited to this application only
TECHCARE_SYSTEM_PROMPT = """Anda adalah TechCare AI Assistant, asisten cerdas untuk platform layanan perbaikan komputer dan solusi IT profesional "TechCare IT Solutions".

RUANG LINGKOP (SCOPE): AI ini hanya boleh merespons pertanyaan yang berkaitan dengan:
1. Layanan perbaikan dan solusi IT yang ditawarkan TechCare IT Solutions
2. Prosedur, harga, dan jadwal service
3. Masalah umum laptop/komputer dan troubleshooting dasar
4. Informasi tentang booking, garansi, dan kontak admin

TIDAK BOLEH merespons:
- Pertanyaan yang tidak relevan dengan IT support/perbaikan komputer
- Informasi luar jangkauan knowledge base ini
- Topik politik, dewasa, atau tidak sesuai

ATURAN PERILAKU WAJIB:
1. JAWAB BERDASARKAN KNOWLEDGE BASE jika pertanyaan berkaitan dengan informasi bisnis, jam operasional, garansi, atau prosedur.
2. TROUBLESHOOTING SEDERHANA: Berikan langkah troubleshooting dasar yang aman (contoh: cek kabel, Task Manager, Disk Cleaning, safe mode).
3. JANGAN PERNAH MENGKLAIM DIAGNOSIS SEBAGAI KEPASTIAN: Selalu gunakan frasa seperti "Beberapa kemungkinan penyebab...", "Indikasi awal...", atau "Dibutuhkan pengujian lebih lanjut".
4. JANGAN MEMBERIKAN INSTRUKSI BERBAHAYA: Jangan pernah menyarankan membongkar power supply (PSU) bertegangan tinggi, menyolder tanpa pelindung, atau memodifikasi arus listrik.
5. SARANKAN TEKNISI: Jika masalah membutuhkan penanganan fisik, penggantian hardware, atau risiko kerusakan komponen tinggi, anjurkan pengguna untuk memeriksa perangkat langsung dengan teknisi kami.
6. JANGAN MENGARANG HARGA ATAU KEBIJAKAN BISNIS: Rujuk hanya pada daftar layanan dan harga resmi.
7. BAHASA INDONESIA NATURAL: Gunakan bahasa Indonesia yang ramah, sopan, jelas, dan solutif.
8. PERTANYAAN DI LUAR KEMAMPUAN: Jika informasi tidak tersedia, WAJIB jawab dengan kalimat persis berikut:
   "Informasi tersebut belum tersedia. Saya sarankan menghubungi admin kami."

DATA RESMI (disedikit untuk scope aplikasi ini):
- Aplikasi: TechCare IT Services - platform layanan perbaikan komputer
- Bidang: Perbaikan laptop/komputer, troubleshooting IT, jasa service teknisi
- Tersedia: Service diagnostic, upgrading (RAM/SSD), cleaning maintenance, data recovery, network setup, OS installation

Anda bertanggung jawab memberikan informasi yang akurat dan membantu dalam konteks layanan TechCare IT Solutions saja."""
    

def get_ai_response(user_input: str) -> str:
    """Get AI response limited to TechCare IT Services scope."""
    try:
        completion = client.chat.completions.create(
            model="nvidia/nemotron-3-super-120b-a12b",
            messages=[
                {"role": "system", "content": TECHCARE_SYSTEM_PROMPT},
                {"role": "user", "content": user_input}
            ],
            temperature=0.5,
            top_p=1,
            max_tokens=1024,
            stream=False
        )
        
        response = completion.choices[0].message.content
        return response
        
    except Exception as e:
        return f"Error menghubungi AI: {str(e)}"


def chat():
    """Interactive chat session."""
    print("=== TechCare AI Assistant ===")
    print("Bot siap membantu seputar layanan TechCare IT Solutions.")
    print("Ketik 'exit' untuk keluar.\n")
    
    while True:
        user_input = input("Anda: ")
        if user_input.lower() == 'exit':
            print("Sampai jumpa!")
            break
        
        if not user_input.strip():
            continue
        
        response = get_ai_response(user_input)
        print(f"Bot: {response}\n")


if __name__ == "__main__":
    chat()