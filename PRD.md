# PRODUCT REQUIREMENT DOCUMENT (PRD)
## TECHCARE AI IT SERVICES PLATFORM
**Versi Dokumen:** 2.0 (Post-Implementation Baseline)  
**Tanggal Rilis:** November 2026  
**Status Proyek:** Production Ready / MVP Complete  
**Tech Stack:** Next.js 15 (App Router), React 19, Prisma ORM 5, SQLite, Tailwind CSS, TypeScript, Dynamic LLM Engine (NVIDIA NIM / Google Gemini / OpenAI).

---

## 1. Executive Summary & Product Vision

### 1.1 Latar Belakang Masalah
Industri perbaikan komputer dan perangkat keras konvensional di Indonesia menghadapi sejumlah tantangan sistemik:
- **Ketidakpastian Diagnosa & Biaya:** Pelanggan sering merasa khawatir terhadap penetapan harga suku cadang dan jasa yang tidak transparan atau dinaikkan sepihak tanpa persetujuan awal.
- **Pencatatan Manual yang Rentan Hilang:** Penggunaan kertas nota fisik menyebabkan riwayat klaim garansi, identitas perangkat, dan catatan kerusakan sulit terlacak.
- **Beban Dukungan Pelanggan (Customer Support Overhead):** Pertanyaan berulang terkait jam buka bengkel, troubleshooting dasar, dan status pengerjaan perangkat menguras waktu kerja staf.
- **Keterbatasan Penugasan Kerja:** Pemilik bengkel kesulitan memetakan keahlian khusus staf teknisi dengan kategori kerusakan yang masuk.

### 1.2 Visi Produk
Membangun platform **TechCare AI IT Services**, yaitu ekosistem web terpadu yang mendigitalisasi siklus hidup reparasi komputer secara *end-to-end* (mulai dari konsultasi, diagnosa awal, penugasan teknisi, persetujuan biaya, hingga penerbitan faktur digital), didukung oleh **Database-Grounded AI Assistant** yang mampu berinteraksi secara real-time dengan basis data operasional bengkel secara aman dan akurat.

---

## 2. Target Pengguna & Persona

| Pengguna (Persona) | Profil & Deskripsi | Kebutuhan Utama |
| :--- | :--- | :--- |
| **Pengunjung (Guest)** | Publik umum yang mengakses website sebelum mendaftar. | Mengetahui reputasi bengkel, menjelajahi katalog harga dasar, konsultasi awal seputar gejala laptop rusak. |
| **Pelanggan (Customer)** | Pemilik laptop/PC/storage rusak yang membutuhkan servis profesional. | Konsultasi 24/7 dengan AI, alur pemesanan mudah, pelacakan status pengerjaan, kontrol persetujuan biaya (*approval gate*), dan faktur resmi. |
| **Administrator (Admin)** | Pemilik bengkel, kepala operasional, atau kasir. | Pusat kendali KPI bisnis, manajemen penugasan teknisi, input biaya & rincian spare parts, approval pembayaran, dan pengaturan provider AI. |
| **Master Teknisi (Technician)** | Staf profesional dengan keahlian khusus perbaikan. | Alokasi tiket servis yang sesuai dengan spesialisasi (Board, Software, Data Recovery) tanpa kelebihan beban kerja (*workload balance*). |

---

## 3. Arsitektur Informasi & Peta Halaman (Sitemap)

```
TechCare Web Application
│
├── [Rute Publik]
│   ├── /                         (Landing page, profil bengkel, testimonial, CTA)
│   ├── /services                 (Katalog layanan & filter kategori)
│   ├── /services/[id]            (Detail cakupan layanan & estimasi durasi)
│   ├── /login                    (Form autentikasi masuk)
│   └── /register                 (Form registrasi customer baru)
│
├── [Portal Pelanggan: /customer/*] (Middleware Auth Guard)
│   ├── /customer/dashboard       (Overview status pesanan aktif & riwayat)
│   ├── /customer/ai              (AI Assistant interface - konsultasi & booking)
│   ├── /customer/request         (Form pemesanan servis dengan fitur auto pre-fill)
│   ├── /customer/request/success (Tanda terima pengajuan & nomor tiket)
│   ├── /customer/orders          (Daftar seluruh pesanan milik pelanggan)
│   ├── /customer/orders/[id]     (Detail progres 7 tahap & Approval Gate biaya)
│   ├── /customer/invoices        (Daftar faktur tagihan biaya servis)
│   ├── /customer/invoices/[id]   (Pratinjau faktur profesional & cetak PDF)
│   ├── /customer/notifications   (Notifikasi internal real-time)
│   └── /customer/profile         (Pengaturan biodata & keamanan akun)
│
└── [Panel Admin: /admin/*] (Role Guard: ADMIN Only)
    ├── /admin/dashboard          (Executive KPI, tren order, ringkasan finansial)
    ├── /admin/orders             (Manajemen pesanan, filter status, assign teknisi)
    ├── /admin/orders/[id]        (Kontrol progres pesanan, edit biaya final)
    ├── /admin/invoices           (Manajemen invoice, pelunasan kasir, spare parts)
    ├── /admin/invoices/[id]      (Cetak faktur resmi perusahaan)
    ├── /admin/customers          (Database pelanggan & riwayat servis per user)
    ├── /admin/technicians        (Master teknisi, spesialisasi, status aktif)
    ├── /admin/services           (Master katalog paket servis, durasi & tarif)
    ├── /admin/knowledge-base     (Pusat rujukan troubleshooting AI Assistant)
    ├── /admin/ai-config          (Manajemen dinamis Provider AI, API Key, Model)
    └── /admin/notifications      (Notifikasi operasional bengkel)
```

---

## 4. Spesifikasi Fungsional Fitur (Feature Specifications)

### 4.1 Modul AI Assistant Terintegrasi Database (`/customer/ai`)
- **Fungsi Utama:** Memberikan diagnosa interaktif, panduan mandiri yang aman, rekomendasi paket servis, serta membaca data pesanan/faktur langsung dari database SQLite.
- **Mekanisme Database Context Injection (`src/lib/ai/db-context.ts`):**
  - Mengambil data aktual secara real-time saat pengguna bertanya.
  - **Filter Hak Akses (Role-Based AI):**
    - **Customer:** Hanya melihat data profil, status pesanan aktif, dan tagihan invoice miliknya sendiri. Permintaan data pelanggan lain atau data keuangan bengkel ditolak secara otomatis.
    - **Admin:** Memiliki akses ke statistik global (total pengguna, daftar pengguna, total teknisi, ringkasan omset/pendapatan, invoice belum dibayar, pesanan terbaru).
    - **Guest:** Hanya menerima informasi katalog servis publik dan artikel panduan teknis.
- **Konversi Chat ke Tiket Servis (One-Click Booking):**
  - Saat obrolan mendeteksi kebutuhan servis fisik, AI mengekstrak entitas: `deviceType`, `deviceBrand`, `deviceModel`, dan `problemDescription`.
  - AI memunculkan tombol interaktif **[Buat Service Request]** yang mengarahkan pengguna ke `/customer/request` dalam keadaan formulir sudah terisi otomatis (*pre-filled*).
- **Keamanan Prompt:** Sanitasi terhadap serangan *Prompt Injection* dan pencegahan kebocoran *hash password*.

### 4.2 Siklus Hidup Pesanan Servis (Order Lifecycle Management)
Pesanan melewati 7 status pengerjaan yang terstruktur:
1. `REQUESTED`: Pesanan baru dibuat customer, menunggu verifikasi jadwal oleh admin.
2. `DIAGNOSING`: Perangkat telah tiba di bengkel dan sedang diperiksa oleh teknisi.
3. `WAITING_APPROVAL`: Estimasi biaya perbaikan dan kebutuhan suku cadang telah diinput admin; menunggu persetujuan pelanggan.
4. `IN_PROGRESS`: Pelanggan menyetujui biaya; teknisi mulai melakukan perbaikan fisik.
5. `READY`: Pengerjaan selesai; perangkat lolos uji fungsi (*QC Passed*) dan siap diambil di workshop.
6. `COMPLETED`: Pelanggan telah mengambil unit dan tagihan telah lunas.
7. `CANCELLED`: Pesanan dibatalkan (baik atas permintaan customer atau penolakan estimasi biaya).

### 4.3 Customer Approval Gate (Persetujuan Biaya)
- Mencegah perbaikan dilakukan sebelum customer mengetahui dan menyetujui biayanya.
- Pelanggan diberikan tombol tindakan jelas pada `/customer/orders/[id]`:
  - **Setujui Tindakan & Biaya**: Mengubah status ke `IN_PROGRESS` dan mengirim notifikasi ke teknisi/admin.
  - **Tolak / Batalkan**: Mengubah status pesanan ke `CANCELLED` sehingga unit dapat dikembalikan tanpa biaya perbaikan lanjutan.

### 4.4 Modul Billing & Faktur Digital (Invoices)
- Setiap pesanan dapat diterbitkan 1 invoice resmi (`INV-YYYY-XXXX`).
- Komponen perhitungan:
  $$\text{Subtotal} = \text{Biaya Jasa Servis} + \sum (\text{Harga Satuan Spare Part} \times \text{Qty})$$
  $$\text{Total Tagihan} = \text{Subtotal} - \text{Diskon}$$
- Status pembayaran: `UNPAID` (Belum Bayar), `PENDING` (Customer sudah transfer/konfirmasi), dan `PAID` (Lunas diverifikasi kasir).
- Tampilan faktur siap cetak/unduh PDF dengan format A4 profesional.

### 4.5 Konfigurasi Multi-Provider AI (`/admin/ai-config`)
- **Fungsi:** Memungkinkan admin mengganti penyedia LLM tanpa *downtime* atau *deploy ulang* server.
- **Dukungan Provider:**
  - **NVIDIA NIM:** Endpoint OpenAI-compatible (`integrate.api.nvidia.com`). Model default: `nvidia/nemotron-3-super-120b-a12b`.
  - **Google Gemini:** Endpoint resmi Google AI Studio (`generativelanguage.googleapis.com`). Model: `gemini-2.0-flash` / `gemini-1.5-flash`.
  - **OpenAI / Groq / Custom LLM:** Mendukung endpoint OpenAI standar dengan pengaturan base URL kustom.
- **Fitur Live Test Connection:** Fitur verifikasi API key dan latensi respons secara instan sebelum disimpan sebagai *Primary Provider*.
- **Local Fallback Engine:** Jika API LLM eksternal mengalami kendala kuota atau koneksi, sistem secara otomatis beralih ke *Knowledge Fallback Engine* lokal sehingga chatbot tetap dapat menjawab pertanyaan database dan FAQ dasar.

### 4.6 Sistem Notifikasi Terpadu (In-App, WhatsApp & Telegram)
- Memicu notifikasi otomatis saat terjadi *event* krusial:
  - Pesanan baru diterima
  - Estimasi biaya siap disetujui
  - Progres pengerjaan diperbarui
  - Invoice diterbitkan
  - Konfirmasi pembayaran diterima
- Saluran notifikasi mencakup lonceng aplikasi (*in-app notification center*), integrasi pesan WhatsApp (Fonnte / Wablas / Meta API), dan Telegram Bot.

---

## 5. Skema Data & Relasi Database (Data Schema)

Aplikasi menggunakan skema relasional terstruktur pada SQLite via Prisma:

```prisma
// Entity: User & Authentication
model User {
  id        String           @id @default(cuid())
  name      String
  email     String           @unique
  password  String           // Hashed using bcryptjs
  role      String           @default("CUSTOMER") // "ADMIN" | "CUSTOMER"
  phone     String?
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  profile         CustomerProfile?
  orders          ServiceOrder[]
  aiConversations AiConversation[]
  notifications   Notification[]
  @@map("users")
}

// Entity: Customer Profile Detail
model CustomerProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  address   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@map("customer_profiles")
}

// Entity: Service Catalog
model Service {
  id                String         @id @default(cuid())
  name              String
  category          String
  description       String
  priceFrom         Float
  estimatedDuration String
  isActive          Boolean        @default(true)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  orders ServiceOrder[]
  @@map("services")
}

// Entity: Technician Staff
model Technician {
  id             String         @id @default(cuid())
  name           String
  phone          String
  specialization String
  isActive       Boolean        @default(true)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  assignedOrders ServiceOrder[]
  @@map("technicians")
}

// Entity: Service Order Ticket
model ServiceOrder {
  id                 String       @id @default(cuid())
  orderNumber        String       @unique // e.g. SRV-2026-0001
  customerId         String
  customer           User         @relation(fields: [customerId], references: [id], onDelete: Cascade)
  serviceId          String
  service            Service      @relation(fields: [serviceId], references: [id], onDelete: Restrict)
  technicianId       String?
  technician         Technician?  @relation(fields: [technicianId], references: [id], onDelete: SetNull)
  deviceType         String       // Laptop, PC, Storage, etc.
  deviceBrand        String
  deviceModel        String
  problemDescription String
  preferredSchedule  String?
  status             String       @default("REQUESTED") // 7-state lifecycle
  estimatedCost      Float?
  finalCost          Float?
  notes              String?
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  invoice Invoice?
  @@map("service_orders")
}

// Entity: Invoice & Billing
model Invoice {
  id            String       @id @default(cuid())
  invoiceNumber String       @unique // e.g. INV-2026-0001
  orderId       String       @unique
  order         ServiceOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  serviceFee    Float        @default(0)
  spareParts    String?      // JSON format: [{ name, qty, unitPrice }]
  subtotal      Float
  discount      Float        @default(0)
  total         Float
  paymentStatus String       @default("UNPAID") // UNPAID | PENDING | PAID | CANCELLED
  paymentMethod String?      // Cash | Bank Transfer
  notes         String?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  @@map("invoices")
}

// Entity: Dynamic AI Configuration
model AiConfig {
  id           String   @id @default(cuid())
  providerName String   // NVIDIA, Google Gemini, OpenAI, etc.
  providerSlug String   @unique // nvidia, gemini, etc.
  apiKey       String
  model        String
  baseUrl      String?
  isActive     Boolean  @default(false)
  isPrimary    Boolean  @default(false)
  maxTokens    Int      @default(1200)
  temperature  Float    @default(0.3)
  timeoutMs    Int      @default(30000)
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@map("ai_configs")
}

// Entity: Knowledge Base Articles
model KnowledgeBase {
  id          String   @id @default(cuid())
  title       String
  content     String
  category    String
  isPublished Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@map("knowledge_bases")
}

// Entity: Conversation & In-App Notification
model AiConversation {
  id        String      @id @default(cuid())
  sessionId String      @unique
  userId    String?
  user      User?       @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String?
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  messages  AiMessage[]
  @@map("ai_conversations")
}

model AiMessage {
  id             String         @id @default(cuid())
  conversationId String
  conversation   AiConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           String         // user | assistant | system
  content        String
  metadata       String?        // Recommendation cards / proposal metadata
  createdAt      DateTime       @default(now())
  @@map("ai_messages")
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String
  title     String
  message   String
  isRead    Boolean  @default(false)
  link      String?
  metadata  String?
  createdAt DateTime @default(now())
  @@map("notifications")
}
```

---

## 6. Persyaratan Non-Fungsional (Non-Functional Requirements)

### 6.1 Keamanan Sistem (Security)
- **Kerahasiaan Kredensial:** Kata sandi dienkripsi dengan *salt hash* `bcryptjs` (faktor biaya 10). Kredensial API eksternal disimpan di server-side database dan tidak pernah terekspos utuh ke browser klien (*masked string*).
- **Session Management:** Autentikasi menggunakan JWT bertandatangan `jose` dengan atribut `HttpOnly`, `SameSite: Lax`, dan masa berlaku 7 hari.
- **Perlindungan Terhadap Serangan:**
  - Sanitasi tag HTML dan pola injeksi prompt pada input percakapan AI.
  - Otorisasi IDOR (*Insecure Direct Object Reference*): Pelanggan hanya dapat melihat tiket dan invoice milik ID mereka sendiri.
  - Server-Side Route Guard: Seluruh endpoint `/api/admin/*` dan halaman `/admin/*` divalidasi mutlak menggunakan helper `requireAdmin()`.

### 6.2 Performa & Keandalan (Performance & Reliability)
- **Rendering Dinamis & Caching:** Menggunakan Next.js App Router dengan SSR (*Server-Side Rendering*) untuk halaman data sensitif, dan ISR/SSG untuk halaman publik.
- **Cache Provider Konfigurasi AI:** Caching memori 30 detik untuk pembacaan konfigurasi AI di database guna menghindari query berlebih (*database hammering*).
- **Graceful Fallback:** Sistem beralih ke *Knowledge Fallback Engine* lokal dalam hitungan milidetik jika koneksi internet atau kuota LLM habis, memastikan pengguna tidak pernah mendapatkan layar putih (*white screen error*).

### 6.3 Desain Antarmuka & Aksesibilitas (UI/UX)
- Antarmuka bertema gelap modern (*Cyberpunk/Dark Slate Tech*) dengan warna aksen Cyan (`#38bdf8`) dan Indigo (`#6366f1`).
- Tata letak responsif penuh (*Mobile-First Responsive Design*) dengan dukungan drawer navigasi mobile dan tabel yang dapat digeser pada perangkat layar kecil.

---

## 7. Metrik Keberhasilan Produk (Success Metrics)

1. **Efisiensi Waktu Diagnosa Awal:** Penurunan durasi konsultasi awal hingga 60% berkat analisa otomatis oleh AI Assistant.
2. **Tingkat Transparansi Biaya:** 100% pesanan pengerjaan perangkat keras mendapatkan persetujuan tertulis pelanggan melalui *Approval Gate* sebelum status berganti ke `IN_PROGRESS`.
3. **Akurasi Data Operasional:** Tidak ada manipulasi atau inkonsistensi antara nilai tagihan faktur dengan nominal yang tercatat pada pesanan servis.
4. **Keandalan AI Chatbot:** 0% kebocoran data pelanggan lain saat berinteraksi dengan AI berkat penerapan *Role-Based Context Layer*.

---

## 8. Rencana Pengembangan Selanjutnya (Roadmap Masa Depan)

- [ ] **Payment Gateway Integration:** Menghubungkan invoice dengan Midtrans / Xendit untuk pembayaran otomatis via Virtual Account, QRIS, dan E-Wallet.
- [ ] **Portal Mandiri Teknisi (`/technician/*`):** Menyediakan akun login khusus teknisi untuk mengunggah foto bukti perbaikan dan mencatat suku cadang langsung dari meja kerja.
- [ ] **Modul Stok Fisik Gudang (Inventory Warehouse):** Tabel mandiri untuk pencatatan stok suku cadang fisik, peringatan stok menipis (*low stock alert*), dan harga modal (HPP).
- [ ] **Live GPS Device Tracking:** Pelacakan penjemputan dan pengantaran unit servis laptop secara real-time di peta.
