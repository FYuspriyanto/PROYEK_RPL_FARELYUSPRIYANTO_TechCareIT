# TechCare — Platform IT Service & Computer Repair

Aplikasi web untuk jasa servis komputer/laptop: customer mengajukan permintaan servis,
mempantau progres 7 tahap, menyetujui estimasi biaya, dan membayar invoice — admin
mengelola order, teknisi, invoice, dan knowledge base dari satu panel.

**Tech stack:** Next.js 15 (App Router) · React 19 · Prisma 5 + SQLite · JWT cookie (`jose`) ·
password hashing (`bcryptjs`) · validasi (`zod`) · AI: Gemini / OpenAI dengan fallback knowledge base.

---

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