# TechCare — Platform IT Service & Computer Repair

Aplikasi web untuk jasa servis komputer/laptop: customer mengajukan permintaan servis,
mempantau progres 7 tahap, menyetujui estimasi biaya, dan membayar invoice — admin
mengelola order, teknisi, invoice, dan knowledge base dari satu panel.

**Tech stack:** Next.js 15 (App Router) · React 19 · Prisma 5 + SQLite · JWT cookie (`jose`) ·
password hashing (`bcryptjs`) · validasi (`zod`) · AI: Gemini / OpenAI dengan fallback knowledge base.

-------

## 👨‍💻 1. Identitas Pengembang

Informasi pengembang proyek:

| Informasi | Keterangan |
| :--- | :--- |
| **Nama** | Farel Yuspriyanto |
| **NIM** | 41257104 |
| **Kelompok** | 3 |
| **Tema Kelompok** | AD Komputer |
| **Mata Kuliah** | Rekayasa Perangkat Lunak

---

## 📹 2. Video Demonstrasi Aplikasi

Tautan video demonstrasi alur dan fitur aplikasi TechCare dapat diakses melalui link YouTube berikut:

🔗 **Link Video Demonstrasi:**  
https://youtu.be/y27HggtgKxk?si=dugfUmyLYFOtTyHc


---

## 📖 3. Deskripsi Aplikasi

### 3.1 Latar Belakang & Permasalahan yang Diselesaikan
Layanan perbaikan komputer konvensional seringkali menghadapi berbagai kendala:
1. **Ketidakpastian Biaya & Manipulasi Harga:** Pelanggan sering merasa ragu karena biaya perbaikan baru diinformasikan di akhir tanpa persetujuan awal atau rincian suku cadang yang jelas.
2. **Pencatatan Fisik yang Rentan Hilang:** Penggunaan kuitansi/nota kertas konvensional rawan hilang, rusak, dan menyulitkan pelacakan histori pengerjaan serta klaim garansi.
3. **Keterbatasan Informasi Status Servis:** Pelanggan harus berulang kali menghubungi pihak bengkel untuk menanyakan apakah unit sudah selesai diperiksa atau diperbaiki.
4. **Beban Komunikasi & Konsultasi:** Staf bengkel menghabiskan banyak waktu menjawab pertanyaan diagnosa awal dasar yang berulang dari calon pelanggan.

### 3.2 Tujuan Aplikasi
TechCare hadir sebagai solusi platform digital *end-to-end* yang bertujuan:
- Memberikan **transparansi total** dalam penetapan estimasi biaya dan suku cadang sebelum pengerjaan dilakukan melalui sistem *Approval Gate*.
- Menyediakan **pelacakan status pengerjaan secara real-time** dengan alur 7 status yang jelas.
- Menghadirkan **konsultasi diagnosa cerdas berbasis AI** yang dapat mengenali gejala kerusakan serta memberikan panduan awal secara instan 24/7.
- Mempermudah **manajemen operasional bengkel** (penugasan teknisi, pembuatan faktur digital, pengelolaan katalog layanan, serta notifikasi terpadu).

### 3.3 Gambaran Umum Cara Kerja Aplikasi
1. **Pelanggan** mendaftar akun, berkonsultasi via AI Chatbot atau langsung memilih layanan di katalog, kemudian mengisi form pengajuan servis (*Service Request*).
2. Sistem otomatis membuat tiket pesanan (`REQUESTED`) dan faktur awal (`UNPAID`), serta mengirimkan notifikasi instan ke admin.
3. **Admin** meninjau pesanan, menugaskan teknisi ahli sesuai spesialisasinya, dan memulai tahap diagnosa (`DIAGNOSING`).
4. Setelah diagnosa selesai, admin memasukkan estimasi biaya dan suku cadang (`WAITING_APPROVAL`).
5. **Pelanggan** memeriksa estimasi dan memutuskan untuk **Menyetujui** (status lanjut ke `IN_PROGRESS`) atau **Menolak** (status menjadi `CANCELLED`).
6. Teknisi menyelesaikan perbaikan hingga perangkat siap diambil (`READY`).
7. Pelanggan melakukan pembayaran (Cash / Transfer Bank), admin memverifikasi pelunasan invoice (`PAID`), dan unit diserahkan (`COMPLETED`).

---

## 🤖 4. Fitur AI (Artificial Intelligence)

Aplikasi TechCare dilengkapi dengan modul **AI Diagnostic Assistant** yang terintegrasi secara cerdas dengan backend dan database sistem.
### 4.1 Kemampuan & Fungsi Utama AI
1. **Diagnosa & Troubleshooting Cerdas:**
   - AI mampu menganalisis gejala kerusakan hardware/software berdasarkan keluhan bahasa alami pengguna (contoh: *"Laptop lemot"*, *"Laptop cepat panas"*, *"PC mati total"*).
   - Memberikan langkah-langkah *troubleshooting* mandiri yang aman (seperti *Task Manager*, *Disk Cleanup*, *Power Drain*).
   - Memberikan peringatan keselamatan dan merekomendasikan penanganan teknisi ahli jika kerusakan berisiko tinggi.
2. **Rekomendasi Layanan Otomatis:**
   - Memetakan keluhan pengguna secara langsung dengan paket layanan resmi dari database TechCare beserta estimasi harga dasarnya.
3. **One-Click Service Booking (Pre-filled Request):**
   - AI secara otomatis mengekstrak informasi entitas perangkat (tipe, merek, model, dan ringkasan masalah) dari percakapan.
   - Memunculkan tombol interaktif **[Buat Service Request]** yang mengarahkan pelanggan ke form pengajuan servis dengan data yang telah terisi otomatis.
4. **Pembacaan Database Real-Time Berbasis Peran (Role-Based DB Grounding):**
   - **Customer:** AI dapat membaca status pesanan aktif, nomor tiket, teknisi bertugas, dan status tagihan invoice milik akun yang sedang login. AI menolak memberikan data pengguna lain atau data rahasia bengkel.
   - **Admin:** AI dapat menjawab metrik bisnis global (total pengguna, daftar pelanggan, jumlah teknisi, total pesanan sistem, breakdown status, invoice belum dibayar, serta total pendapatan).
   - **Guest:** AI melayani pertanyaan umum seputar katalog layanan publik, jam operasional, dan artikel panduan teknis (*Knowledge Base*).
5. **Panel Konfigurasi Multi-Provider AI (`/admin/ai-config`):**
   - Admin dapat memilih dan mengatur penyedia AI secara dinamis tanpa perlu mengubah kode atau me-restart server:
     - **NVIDIA NIM** (Default, model `nvidia/nemotron-3-super-120b-a12b`)
     - **Google Gemini** (`gemini-2.0-flash`, `gemini-1.5-flash`)
     - **OpenAI / Groq / Custom LLM** (mendukung endpoint kompatibel OpenAI)
   - Dilengkapi fitur **Uji Koneksi (Test Connection)** langsung untuk memverifikasi API Key dan latensi respons.
6. **Local Knowledge Fallback Engine:**
   - Jika kuota API eksternal habis atau jaringan terputus, sistem secara otomatis beralih ke mesin fallback lokal berbasis artikel *Knowledge Base* database sehingga asisten tidak pernah mati (*fail-safe*).

### 4.2 Manfaat Fitur AI bagi Pengguna
- **Bagi Pelanggan:** Mendapatkan jawaban instan tanpa antre, memahami perkiraan masalah komputer secara objektif, dan menghemat waktu pengisian formulir servis.
- **Bagi Admin/Bengkel:** Mengurangi beban kerja tim CS, mempercepat proses konversi konsultasi menjadi pesanan servis nyata, dan mempermudah rekapitulasi data operasional melalui percakapan cepat.

---

## 🚀 5. Fitur-Fitur Utama Aplikasi

Berdasarkan implementasi kode dan skema database riil yang berjalan:

### 5.1 Portal Pelanggan (Customer)
- **Autentikasi Mandiri:** Registrasi akun baru dan login aman dengan session berbasis cookie HTTP-Only.
- **Customer Dashboard (`/customer/dashboard`):** Ringkasan tiket servis aktif, notifikasi tindakan tertunda, dan riwayat pesanan.
- **Pengajuan Servis (`/customer/request`):** Pilihan jenis perangkat (Laptop, PC Desktop, Storage), merek, model, deskripsi keluhan, jadwal preferensi, dan alamat.
- **Pelacakan Tiket & Timeline Progres (`/customer/orders/[id]`):** Visualisasi alur 7 status pesanan, catatan teknisi, dan invoice terkait.
- **Gerbang Persetujuan Biaya (Customer Approval Gate):** Tombol aksi *Setujui & Mulai Perbaikan* atau *Tolak Estimasi* saat status pesanan berada pada tahap `WAITING_APPROVAL`.
- **Faktur Digital Siap Cetak (`/customer/invoices/[id]`):** Rincian biaya jasa, suku cadang (*spare parts*), diskon, informasi rekening bank, konfirmasi transfer, dan cetak faktur PDF.
- **Pusat Notifikasi (`/customer/notifications`):** Lonceng notifikasi real-time untuk setiap perubahan status pesanan dan penerbitan faktur.
- **Pengaturan Profil (`/customer/profile`):** Kelola biodata, nomor telepon, alamat, dan ganti kata sandi.

### 5.2 Panel Administrator (Admin)
- **Executive Dashboard (`/admin/dashboard`):** Kartu metrik live (Total Pelanggan, Request Baru, Servis Aktif, Servis Selesai, Total Pendapatan, dan Tagihan Tertunggak).
- **Manajemen Pesanan Servis (`/admin/orders`):** Filter status & tanggal, pencarian nomor tiket/pelanggan, penugasan teknisi (*technician assignment*), pembaruan status pengerjaan, serta penetapan estimasi dan biaya final.
- **Manajemen Invoice & Kasir (`/admin/invoices`):** Penerbitan faktur, penambahan rincian suku cadang pengganti (*JSON spare parts*), diskon, dan verifikasi pelunasan status `PENDING` ➔ `PAID`.
- **Manajemen Pelanggan (`/admin/customers`):** Direktori data kontak pelanggan dan rekap total pembelanjaan/riwayat servis.
- **Manajemen Teknisi (`/admin/technicians`):** Tambah, ubah data kontak, atur bidang keahlian (*spesialisasi*), dan aktif/nonaktifkan status teknisi.
- **Manajemen Katalog Layanan (`/admin/services`):** Tambah, ubah nama, deskripsi, kategori, durasi estimasi, dan harga dasar paket servis.
- **Pusat Pengetahuan / Knowledge Base (`/admin/knowledge-base`):** Manajemen artikel panduan teknis yang dipublikasikan ke publik dan menjadi sumber pengetahuan fallback AI.
- **Pusat Konfigurasi AI (`/admin/ai-config`):** Pengaturan dinamis provider LLM, API Key, pemilihan model, pengaturan *temperature*, dan batas token.
- **Pusat Notifikasi Admin (`/admin/notifications`):** Notifikasi otomatis saat ada order baru masuk, konfirmasi approval biaya dari pelanggan, atau konfirmasi transfer pembayaran.

### 5.3 Sistem Keamanan & Proteksi Data
- **Session Management:** Autentikasi token JWT (`jose`) tersimpan dalam HTTP-Only Cookie dengan masa berlaku 7 hari.
- **Enkripsi Kata Sandi:** Hashing kata sandi menggunakan algoritma `bcryptjs` (salt rounds 10).
- **Proteksi Injeksi Prompt AI:** Sanitasi tag HTML dan filter pola perintah manipulasi prompt pada endpoint chat AI.
- **Role-Based Access Control (RBAC):** Middleware ketat di tingkat server untuk memproteksi rute `/admin/*` dan memvalidasi kepemilikan data pesanan/invoice per pengguna (mencegah IDOR).

---

## 🛠️ 6. Petunjuk Instalasi & Menjalankan Aplikasi

Ikuti panduan langkah demi langkah di bawah ini untuk menginstal dan menjalankan TechCare di lingkungan lokal (Local Development).

### 6.1 Persyaratan Perangkat Lunak (Prerequisites)
Pastikan software berikut telah terinstal pada sistem Anda:
- **Node.js**: Versi LTS 18.x, 20.x, atau 22.x (direkomendasikan Node.js v20+)
- **NPM**: Versi 9.x atau 10.x (bawaan dari instalasi Node.js)
- **Git**: (Opsional) untuk cloning repository
- **Web Browser Modern**: Google Chrome, Mozilla Firefox, Microsoft Edge, atau Safari

### 6.2 Langkah Instalasi & Persiapan

#### 1. Masuk ke Direktori Proyek
Buka terminal (Command Prompt, PowerShell, atau Bash) lalu navigasikan ke folder proyek:
```bash
cd c:\xampp\htdocs\Proyekk
```

#### 2. Instalasi Dependensi (Dependencies)
Jalankan perintah berikut untuk mengunduh seluruh package yang tercatat pada `package.json`:
```bash
npm install
```
#### 3. Konfigurasi Environment Variable (`.env`)
Salin file konfigurasi environment atau buat file `.env` di root direktori proyek jika belum ada:
```env
# Database SQLite Lokal
DATABASE_URL="file:./dev.db"

# Kunci Rahasia JWT (Minimal 32 karakter untuk sesi produksi)
JWT_SECRET="super-secret-jwt-key-for-it-services-2026-min-32-chars-length"

# Nama Cookie Sesi
SESSION_COOKIE_NAME="it_service_session"

# Informasi Aplikasi
NEXT_PUBLIC_APP_NAME="TechCare AI IT Services"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Mode Lingkungan (development atau production)
NODE_ENV="development"
PORT=3000

# Konfigurasi Provider AI (Opsional via env, dapat diatur via Panel Admin)
AI_PROVIDER="nvidia"
NVIDIA_API_KEY=""
NVIDIA_MODEL="nvidia/nemotron-3-super-120b-a12b"
GEMINI_API_KEY=""
```

#### 4. Sinkronisasi Database (Prisma ORM)
Sinkronisasikan skema Prisma ke database lokal SQLite (`prisma/dev.db`):
```bash
npm run db:push
```
*Atau lakukan generate client:*
```bash
npm run db:generate
```

#### 5. Pengisian Data Awal / Demo (Database Seeding)
Jalankan proses seeding untuk mengisi data akun pengujian, katalog layanan awal, teknisi, pesanan sampel, dan knowledge base:
```bash
npm run db:seed
```

---

### 6.3 Menjalankan Aplikasi

#### Mode Pengembangan (Development Mode):
```bash
npm run dev
```
Aplikasi akan dijalankan pada server lokal: **http://localhost:3000**

#### Mode Produksi (Production Build & Start):
```bash
npm run build
npm run start
```

---

### 6.4 Cara Mengakses Aplikasi & Akun Pengujian (Demo Accounts)

Buka peramban (browser) dan akses alamat:
👉 **[http://localhost:3000](http://localhost:3000)**

Gunakan akun demo berikut untuk menguji masing-masing hak akses:

| Role Akun | Email | Password | Akses & Fitur |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@techcare.id` | `AdminPassword123!` | Akses penuh dashboard admin (`/admin/dashboard`), manajemen order, teknisi, invoice, dan konfigurasi AI. |
| **Customer 1** | `budi@gmail.com` | `Customer123!` | Akses portal pelanggan, 2 pesanan aktif, histori invoice, dan konsultasi AI pribadi. |
| **Customer 2** | `siti@gmail.com` | `Customer123!` | Akses portal pelanggan dengan contoh pesanan motherboard & OS. |
| **Customer 3** | `hendra@gmail.com` | `Customer123!` | Akses portal pelanggan dengan contoh servis data recovery storage. |

---

## 📁 7. Struktur Direktori Proyek

```
c:\xampp\htdocs\Proyekk
├── prisma/
│   ├── dev.db                      # File Database SQLite lokal
│   ├── schema.prisma               # Definisi skema tabel & relasi data
│   ├── seed.ts                     # Seeder data pengguna, teknisi, & pesanan
│   └── seed-ai-config.mjs          # Seeder konfigurasi provider AI awal
├── src/
│   ├── app/                        # Next.js 15 App Router (Halaman & Endpoint API)
│   │   ├── (auth)/                 # Halaman login & register
│   │   ├── admin/                  # Seluruh halaman panel administrator
│   │   │   ├── ai-config/          # Manajemen provider & API key AI
│   │   │   ├── customers/          # Direktori & riwayat customer
│   │   │   ├── dashboard/          # KPI & overview operasional
│   │   │   ├── invoices/           # Billing & faktur digital
│   │   │   ├── knowledge-base/     # Manajemen artikel troubleshooting
│   │   │   ├── orders/             # Pemrosesan tiket pesanan & assign teknisi
│   │   │   ├── services/           # Manajemen katalog paket servis
│   │   │   └── technicians/        # Manajemen data staf teknisi
│   │   ├── api/                    # REST API Routes backend
│   │   │   ├── admin/              # Endpoint API khusus otorisasi admin
│   │   │   ├── ai/                 # Endpoint percakapan chat & histori AI
│   │   │   ├── auth/               # Endpoint autentikasi (login, register, logout)
│   │   │   ├── invoices/           # Endpoint penagihan & konfirmasi pembayaran
│   │   │   ├── notifications/      # Endpoint sistem notifikasi
│   │   │   └── orders/             # Endpoint pesanan & persetujuan estimasi biaya
│   │   ├── customer/               # Seluruh halaman portal pelanggan
│   │   │   ├── ai/                 # Antarmuka chatbot diagnosa cerdas
│   │   │   ├── dashboard/          # Dashboard ringkasan pelanggan
│   │   │   ├── invoices/           # Tampilan & cetak faktur pelanggan
│   │   │   ├── orders/             # Pelacakan status tiket servis 7 tahap
│   │   │   ├── profile/            # Pengaturan profil pengguna
│   │   │   └── request/            # Formulir pemesanan servis baru
│   │   └── services/               # Halaman katalog publik & detail paket servis
│   ├── components/                 # Komponen UI modular (Navbar, NotificationBell, Timeline, dll.)
│   ├── lib/                        # Utility & business logic backend
│   │   ├── ai/                     # AI Service, Context Builder, Dynamic & Fallback Providers
│   │   ├── notifications/          # Notification Service modular (In-App, WA, Telegram)
│   │   ├── auth.ts                 # Enkripsi bcrypt & manajemen sesi JWT
│   │   └── prisma.ts               # Inisialisasi Prisma Client singleton
│   └── middleware.ts               # Route guard otentikasi & proteksi hak akses role
├── package.json                    # Metadata proyek & daftar dependensi
├── PRD.md                          # Product Requirement Document versi komprehensif
└── README.md                       # Dokumentasi utama proyek
```

---

## 📄 8. Lisensi & Hak Cipta

Proyek ini dikembangkan untuk keperluan akademik dan demonstrasi aplikasi pada program studi Rekayasa Perangkat Lunak / Teknik Komputer.  
**TechCare IT Solutions © 2026. Hak Cipta Dilindungi.**


## 🛡️ 1. Security Improvements (Recent Updates)

This project has undergone a security audit and the following improvements were implemented:

### Environment Protection
- **`.gitignore` created** — Root directory now contains `.gitignore` that excludes `.env*`, `.env.local`, build artifacts, and database files from version control. Prevents accidental exposure of sensitive configuration.

- **`.env` updated for production** — `NODE_ENV` set to `production`. The default `JWT_SECRET` placeholder has been replaced. For production deployment, generate a secure random minimum 32-character secret and set it in your environment.

### JWT Secret Enforcement
- **Middleware + auth.ts now reject default secrets in production** — Both `src/middleware.ts` and `src/lib/auth.ts` throw an error if `JWT_SECRET` is not explicitly set in the environment when `NODE_ENV=production`. This prevents running with the default weak secret in production.

### AI Prompt Injection Protection
- **Message sanitization in AI chat endpoint** — `POST /api/ai/chat` now sanitizes user messages by:
  - Stripping HTML tags (prevents XSS and prompt injection via HTML attributes)
  - Detecting and neutralizing suspicious patterns: `system:`, `prompt:`, `instructions:`, `ignore previous system`, `override`
  - Returns 422 error if suspicious patterns are detected after sanitization

### Security Principles Applied
- Principle of least privilege: Customers can only access their own orders and invoices
- Defense in depth: Multiple layers of authorization (middleware + API route guards)
- Secure by default: Production environment enforces proper configuration

---

## 2. Cara Menjalankan

```bash
npm install
cp .env.example .env        # sesuaikan JWT_SECRET untuk production
npm run db:push              # buat tabel SQLite (prisma/dev.db)
npm run db:seed              # isi data demo (akun, layanan, teknisi, order contoh)
npm run dev                  # http://localhost:3000
```

**Akun demo (dari `prisma/seed.ts`):**

| Role     | Email            | Password          |
|----------|------------------|-------------------|
| Admin    | admin@techcare.id | AdminPassword123! |
| Customer | budi@gmail.com   | Customer123!      |
| Customer | siti@gmail.com   | Customer123!      |
| Customer | hendra@gmail.com | Customer123!      |

---

## 3. Alur Aplikasi

### 2.1 Alur Customer (end-to-end)

```
Register / Login
      │
      ▼
Lihat Katalog Servis (/services) ──► Tanya AI Diagnostic Assistant (opsional)
      │                               (dapat rekomendasi layanan dari gejala)
      ▼
Ajukan Servis (/customer/request)
  - pilih layanan, isi data perangkat + keluhan + jadwal
  - order REQUESTED + invoice UNPAID otomatis dibuat
  - 🔔 customer: ORDER_RECEIVED · admin: NEW_ORDER_ADMIN
      │
      ▼
Pantau Pesanan (/customer/orders/[id] + timeline 7 tahap)
      │
      ├── Admin mulai diagnosa (DIAGNOSING) ──► 🔔 DIAGNOSING
      │
      ├── Admin tetapkan estimasi (WAITING_APPROVAL)
      │     ──► 🔔 ESTIMATE_READY + APPROVAL_NEEDED
      │     ──► Customer klik "Setujui" → IN_PROGRESS (🔔 admin: CUSTOMER_APPROVAL,
      │           🔔 customer: IN_PROGRESS) atau "Tolak" → CANCELLED
      │
      ├── Admin kerjakan (IN_PROGRESS) ──► 🔔 IN_PROGRESS
      │
      ├── Selesai (READY/COMPLETED, garansi 90 hari) ──► 🔔 COMPLETED (+ INVOICE_CREATED)
      │
      ▼
Bayar (/customer/invoices/[id])
  - pilih Cash / Bank Transfer → "Konfirmasi Sudah Bayar" (UNPAID → PENDING)
  - Admin verifikasi → PAID ──► 🔔 customer: PAYMENT_RECEIVED (+ admin: PAYMENT_UPDATE)
```

### 2.2 Alur Admin

```
Login → Dashboard (/admin/dashboard)
  - metrik: total customer, request baru, servis aktif, siap diambil,
    selesai, total revenue (PAID), tagihan tertunggak + workload teknisi
      │
      ├── Orders (/admin/orders) ──► ubah status, assign teknisi,
      │     atur estimasi/final cost, update status bayar, catat diagnosa
      │     (setiap perubahan status memicu notifikasi customer otomatis)
      │
      ├── Invoices (/admin/invoices) ──► buat invoice (jasa + spare part + diskon),
      │     edit sebelum PAID, verifikasi pembayaran PENDING → PAID
      │
      ├── Customers (/admin/customers) ──► riwayat order & total belanja per customer
      ├── Services (/admin/services) ──► CRUD katalog layanan
      ├── Technicians (/admin/technicians) ──► CRUD teknisi + spesialisasi
      ├── Knowledge Base (/admin/knowledge-base) ──► CRUD artikel troubleshooting
      │     (dipakai AI fallback saat LLM tidak tersedia)
      │
      └── Notification Center (/admin/notifications + 🔔 bell)
            - request baru, keputusan approval customer, konfirmasi/terima pembayaran
```

### 2.3 Siklus Status Order

```
REQUESTED → DIAGNOSING → WAITING_APPROVAL → IN_PROGRESS → READY → COMPLETED
                  │             │ (tolak)
                  │             ▼
                  │         CANCELLED
                  ▼
              (admin dapat membatalkan di tahap mana pun)
```

Status pembayaran invoice terpisah: `UNPAID → PENDING → PAID` (atau `CANCELLED`).

---

## 4. Penjelasan Masing-Masing Fitur

### 3.1 Autentikasi & Otorisasi (`src/app/(login|register)`, `src/lib/auth.ts`, `src/middleware.ts`)
- Register/login dengan email + password (bcrypt). Sesi berupa JWT di httpOnly cookie 7 hari.
- Dua role: `ADMIN` dan `CUSTOMER`. Middleware: `/admin/*` hanya admin (customer dialihkan),
  `/customer/*` wajib login, halaman login/register otomatis redirect jika sudah login.
- **Keamanan data**: API dan halaman customer selalu memfilter `customerId = session.id`,
  sehingga customer tidak bisa melihat/mengubah order atau invoice milik orang lain
  (dicek di `GET /api/orders`, `GET /api/orders/[id]`, approve, confirm-payment).
- **Penambahan**: Middleware sekarang melempar error di production jika `JWT_SECRET` tidak diset.

### 3.2 Katalog Layanan (`/services`, `/admin/services`)
- Publik: daftar layanan (nama, kategori, deskripsi, harga mulai, estimasi durasi) + halaman detail.
- Admin: tambah/ubah/nonaktifkan layanan. Harga layanan dipakai sebagai estimasi awal saat order dibuat.

### 3.3 Pengajuan Servis / Request (`/customer/request`, `POST /api/orders`)
- Form tervalidasi zod: layanan, jenis/merk/model perangkat, deskripsi kerusakan (min. 10 karakter),
  jadwal preferensi, alamat (otomatis tersimpan ke profil), catatan.
- Sekali submit: order `REQUESTED` + invoice `UNPAID` dibuat bersamaan, lalu notifikasi
  `ORDER_RECEIVED` (customer) dan `NEW_ORDER_ADMIN` (semua admin).

### 3.4 Pelacakan Order & Timeline (`/customer/orders`, `/admin/orders`, `OrderStatusTimeline`)
- Customer: daftar order dengan filter status + halaman detail (info perangkat, teknisi,
  catatan diagnosa, invoice, timeline visual 6–7 tahap).
- Admin: ubah status, assign teknisi, set `estimatedCost`/`finalCost`, tulis catatan teknisi,
  dan ubah status pembayaran langsung dari halaman order.
- Setiap perubahan status oleh admin otomatis mengirim notifikasi yang sesuai ke customer
  (lihat §3.7).

### 3.5 Persetujuan Estimasi oleh Customer (`POST /api/orders/[id]/approve`)
- Saat order `WAITING_APPROVAL`, customer melihat kotak persetujuan + tombol
  **Setujui & Mulai Perbaikan** (→ `IN_PROGRESS`) atau **Tolak Estimasi** (→ `CANCELLED`).
- Keputusan customer memicu notifikasi `CUSTOMER_APPROVAL` ke semua admin.

### 3.6 Invoice & Pembayaran (`/customer/invoices`, `/admin/invoices`)
- Invoice berisi: jasa + spare part (JSON `{name, qty, unitPrice}`) + diskon → subtotal/total otomatis.
- Admin: buat invoice per order, edit selama belum `PAID`, verifikasi `PENDING → PAID`.
  Invoice `PAID` dikunci dari edit finansial.
- Customer: lihat invoice, cetak/PDF, pilih metode (Cash/Bank Transfer), tombol
  **Konfirmasi Sudah Bayar** (`UNPAID → PENDING`, `POST /api/invoices/[id]/confirm-payment`).
  Invoice lunas menampilkan banner garansi 90 hari.

### 3.7 Notification System (`src/lib/notifications/`, `NotificationBell`, `/api/notifications`)
- **MVP in-app**: semua event disimpan di tabel `notifications` dan tampil real-time
  (polling 30 detik) lewat **notification bell** (badge jumlah belum dibaca, dropdown,
  tandai satu/semua sudah dibaca, hapus) + **notification center** penuh
  (`/customer/notifications`, `/admin/notifications`).
- **Event customer**: request diterima · mulai diagnosa · estimasi tersedia ·
  perlu approval · mulai dikerjakan · selesai · invoice dibuat · pembayaran diterima.
- **Event admin**: service request baru · keputusan approval customer ·
  konfirmasi/pembayaran diterima.
- **Modular**: `NotificationService.send()` fan-out ke daftar channel aktif.
  Sekarang `in-app`; email/WhatsApp tinggal `NotificationService.registerChannel(...)`
  tanpa mengubah kode pemanggil. Endpoint: `GET /api/notifications`,
  `PATCH /api/notifications` (semua dibaca), `PATCH/DELETE /api/notifications/[id]`.

### 3.8 AI Diagnostic Assistant (`/customer/ai`, `/customer/ai-assistant`, `src/lib/ai/`)
- Chatbot diagnosa: user menjelaskan gejala → AI menjawab + merekomendasikan layanan
  dari database (pencocokan kata kunci: lambat→upgrade SSD/RAM, panas→cleaning,
  mati total→motherboard, dsb.) dengan estimasi harga.
- Provider berlapis: **NVIDIA → Gemini → OpenAI → fallback knowledge base lokal**,
  sehingga tetap berguna tanpa API key. Riwayat chat tersimpan per sesi
  (`AiConversation`/`AiMessage`).
- **Akses database berbasis role (RBAC)** — chatbot hanya membaca data sesuai peran akun
  (role diverifikasi dari record database, bukan dari input client):
  - **GUEST** (belum login): hanya data publik — katalog layanan + tarif, teknisi aktif,
    knowledge base. Data pribadi/bisnis tidak tersedia; pengguna diminta login.
  - **CUSTOMER**: data publik + data miliknya sendiri (profil, pesanan, invoice, notifikasi).
    Ditolak jika bertanya data bisnis internal (total pendapatan, total pelanggan, total
    transaksi, statistik penjualan) atau data customer lain.
  - **ADMIN**: data publik + data bisnis global — statistik sistem (total pelanggan, total
    pesanan + breakdown per status, invoice belum/menunggu verifikasi, total pendapatan dari
    invoice PAID), daftar pesanan terbaru sistem, pesanan menunggu approval customer, invoice
    belum dibayar, layanan terpopuler, dan notifikasi admin.
  - Penegakan berlapis: konteks database dibangun sesuai role (`src/lib/ai/db-context.ts`),
    prompt sistem role-aware (`service.ts`), refusal di level service + fallback provider,
    sehingga berlaku untuk semua provider LLM.
- Verifikasi otomatis: `npm run verify:ai` (53 skenario RBAC) — lihat
  `scripts/verify-ai-role-access.ts`.

### 3.9 Knowledge Base (`/admin/knowledge-base`, `GET /api/knowledge-base`)
- Admin kelola artikel troubleshooting (judul, kategori, konten, publish/unpublish).
- Selain dibaca user, artikel menjadi sumber jawaban AI saat LLM tidak tersedia.

### 3.10 Dashboard & Profil
- **Dashboard admin**: kartu metrik + tabel 10 order terbaru + beban kerja teknisi aktif.
- **Dashboard customer**: ringkasan servis aktif, tagihan belum dibayar, dan aktivitas.
- **Profil customer** (`/customer/profile`): nama, telepon, alamat + statistik order.
- **Manajemen teknisi & customer (admin)**: CRUD teknisi (nama, HP, spesialisasi, aktif/nonaktif);
  daftar customer + detail riwayat servis dan total pembelanjaan masing-masing.

---

## 5. Struktur Direktori (ringkas)

```
src/app/                  # Halaman (admin/*, customer/*, services, login, register)
src/app/api/              # REST API: auth, orders (+/[id]/approve), invoices (+/[id]/confirm-payment),
                          # services, technicians, notifications, knowledge-base, ai, profile
src/components/           # NotificationBell, OrderApprovalActions, PaymentConfirmActions, OrderStatusTimeline
src/lib/notifications/    # NotificationService modular + tipe event (service.ts, types.ts)
src/lib/ai/               # AiAssistantService + providers (gemini, openai, knowledge-fallback)
src/lib/                  # auth.ts (JWT/bcrypt), prisma.ts, response.ts, env.ts
src/middleware.ts         # Guard route per role
prisma/                   # schema.prisma (10 model), seed.ts (data demo)
```

---

## 6. Referensi API

| Method & Path | Akses | Fungsi |
|---|---|---|
| `POST /api/auth/register`, `POST /api/auth/login/logout` | Publik | Autentikasi sesi cookie |
| `GET/POST /api/orders` | Login | List order (terfilter role) / buat request servis |
| `GET/PATCH /api/orders/[id]` | Admin | Detail & update order (picu notifikasi status) |
| `POST /api/orders/[id]/approve` | Customer (milik sendiri) | Setujui/tolak estimasi |
| `GET/POST /api/invoices` | Login/Admin-buat | List invoice / buat invoice |
| `GET/PATCH /api/invoices/[id]` | Login/Admin-ubah | Detail & update invoice |
| `POST /api/invoices/[id]/confirm-payment` | Customer (milik sendiri) | Konfirmasi sudah bayar |
| `GET/PATCH /api/notifications`, `PATCH/DELETE /api/notifications/[id]` | Login | Baca, tandai dibaca, hapus notifikasi |
| `GET/POST /api/services`, `GET/POST /api/technicians` | Publik-baca/Admin-tulis | Katalog & teknisi |
| `GET /api/knowledge-base`, `POST /api/ai` | Login | Artikel bantuan & chat AI |
