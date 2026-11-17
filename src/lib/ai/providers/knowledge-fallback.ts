import { ChatMessage, LLMProvider } from '../types';
import { DatabaseContext } from '../db-context';

export interface KBArticleContext {
  title: string;
  category: string;
  content: string;
}

export class KnowledgeFallbackProvider implements LLMProvider {
  readonly name = 'knowledge-fallback';
  private kbArticles: KBArticleContext[] = [];
  private dbContext: DatabaseContext | null = null;

  constructor(kbArticles: KBArticleContext[] = []) {
    this.kbArticles = kbArticles;
  }

  isAvailable(): boolean {
    return true; // Always available as local safe fallback
  }

  setArticles(articles: KBArticleContext[]) {
    this.kbArticles = articles;
  }

  setDatabaseContext(context: DatabaseContext) {
    this.dbContext = context;
  }

  async generateResponse(_systemPrompt: string, _history: ChatMessage[], userMessage: string): Promise<string> {
    const q = userMessage.toLowerCase().trim();
    const raw = this.dbContext?.raw;
    const metrics = raw;
    const role = raw?.userRole;
    const isAdmin = role === 'ADMIN';
    const isGuest = !raw?.userName;

    // Pesan penolakan standar untuk data internal (non-admin)
    const internalDataRefusal = isGuest
      ? 'Maaf, untuk melihat ringkasan data bisnis internal saya perlu mengetahui akun Anda terlebih dahulu. Silakan login ke akun TechCare Anda. Untuk data bisnis internal perusahaan, hanya admin yang memiliki akses.'
      : 'Maaf, informasi tersebut bersifat internal dan hanya dapat diakses oleh admin TechCare. Saya hanya dapat membantu menampilkan data pesanan dan invoice milik akun Anda sendiri.';

    // 1. CHECK IDENTITY QUESTIONS FIRST
    const identityPatterns = [
      'siapa kamu',
      'kamu siapa',
      'anda siapa',
      'apa nama kamu',
      'kamu ai apa',
      'who are you',
      'what is your name',
      'siapa anda',
    ];
    if (identityPatterns.some((p) => q.includes(p))) {
      const dbStatus = this.dbContext?.raw?.userName
        ? `\n\n🔗 **Koneksi Database:** Terhubung ke database TechCare sebagai **${this.dbContext.raw.userRole || 'CUSTOMER'}** (${this.dbContext.raw.userName}). ${this.dbContext.raw.userRole === 'ADMIN' ? 'Mode admin: Anda dapat menanyakan statistik bisnis, pesanan terbaru sistem, invoice belum dibayar, dan total pendapatan.' : 'Saya dapat membaca status pesanan, invoice tagihan, dan rincian servis milik akun Anda secara real-time.'}`
        : `\n\n🔗 **Koneksi Database:** Terhubung ke sistem database TechCare. Silakan login untuk mengecek status pesanan dan invoice Anda.`;

      return (
        'Saya adalah **TechCare AI Assistant**, asisten virtual cerdas di platform TechCare IT Services. ' +
        'Saya membantu Anda menganalisa kerusakan komputer, memberikan panduan troubleshooting, ' +
        'serta mengakses data pesanan dan invoice Anda dari database.' +
        dbStatus
      );
    }

    // 2. QUESTIONS ABOUT DATABASE CAPABILITIES
    if (
      /baca\s*data\s*base|baca\s*database|akses\s*database|koneksi\s*database|isi\s*database|apakah\s*bisa\s*membaca\s*data|bisa\s*baca\s*data|terhubung\s*database|database/i.test(q)
    ) {
      if (raw?.userName) {
        if (isAdmin) {
          return (
            `Ya, saya terhubung langsung dan dapat membaca data dari database TechCare secara real-time. Mode ADMIN aktif.\n\n` +
            `Ringkasan data yang dapat saya baca untuk Anda:\n` +
            `- Profil Akun: ${raw.userName} (${raw.userEmail}) - Role: ADMIN\n` +
            `- Statistik Bisnis: ${raw.totalCustomers ?? '?'} pelanggan terdaftar, ${raw.totalOrders ?? '?'} pesanan sistem (${raw.activeOrdersCount ?? '?'} aktif)\n` +
            `- Keuangan: ${raw.totalInvoicesUnpaid ?? '?'} invoice belum dibayar, total pendapatan (PAID): Rp ${(raw.totalRevenue ?? 0).toLocaleString('id-ID')}\n` +
            `- Pesanan terbaru: ${(raw.recentOrders || []).length} pesanan terakhir tersedia\n` +
            `- Menunggu approval customer: ${(raw.pendingApprovals || []).length} pesanan\n` +
            `- Katalog Layanan: ${raw.services.length} layanan resmi aktif beserta harga dasar\n\n` +
            `Silakan tanyakan hal spesifik seperti "pesanan terbaru", "berapa total pendapatan", atau "invoice belum dibayar".`
          );
        }
        const orderSummary =
          raw.activeOrders.length > 0
            ? `Anda memiliki **${raw.activeOrders.length} pesanan aktif** (${raw.activeOrders.map((o) => o.orderNumber).join(', ')}).`
            : 'Saat ini belum ada pesanan aktif atas nama Anda.';

        const invoiceSummary =
          raw.invoices.length > 0
            ? `Terdapat **${raw.invoices.length} data invoice** tercatat.`
            : 'Belum ada invoice diterbitkan.';

        const isAdminRole = raw?.userRole === 'ADMIN';
        const metricsSummary = isAdminRole && raw.totalServices !== undefined
          ? `• 📊 **Metrik Database**: ${raw.totalServices} layanan aktif, ${raw.totalCustomers} pelanggan, ${raw.totalOrders} pesanan, ${raw.totalInvoicesUnpaid} invoice belum dibayar`
          : '';

        return (
          `✅ **Ya, saya terhubung langsung dan dapat membaca data dari database TechCare secara real-time!**\n\n` +
          `Berikut ringkasan data yang saat ini dapat saya baca dari database untuk Anda:\n` +
          `• 👤 **Profil Akun**: ${raw.userName} (${raw.userEmail})\n` +
          `• 📋 **Pesanan Anda**: ${orderSummary}\n` +
          `• 🧾 **Tagihan & Invoice**: ${invoiceSummary}\n` +
          `${metricsSummary}\n` +
          `• 🛠️ **Katalog Layanan**: ${raw.services.length} layanan resmi aktif beserta harga dasar\n` +
          `• 📚 **Knowledge Base**: Panduan teknis resmi perusahaan\n\n` +
          `Silakan tanyakan hal spesifik seperti *"Apa status pesanan?"* atau *"Berapa tagihan saya?"*`
        );
      } else {
        return (
          `✅ **Ya, saya terhubung langsung ke database TechCare.**\n\n` +
          `Saya dapat membaca katalog layanan resmi, daftar tarif, tim teknisi, dan artikel knowledge base. ` +
          `Untuk membaca data pesanan atau invoice pribadi Anda, pastikan Anda telah login ke akun customer Anda.`
        );
      }
    }

    // 2B. GUEST meminta data pribadi -> minta login terlebih dahulu
    if (
      !raw?.userName &&
      /pesanan\s*saya|order\s*saya|status\s*(pesanan|servis|service|order)|invoice|tagihan|profil\s*saya|akun\s*saya|data\s*saya|riwayat\s*saya|pembayaran\s*saya|kapan\s*selesai|siap\s*diambil/i.test(q)
    ) {
      return (
        'Untuk mengakses data pesanan, invoice, atau profil Anda, silakan login ke akun TechCare Anda terlebih dahulu. ' +
        'Setelah login, saya dapat membaca data Anda secara real-time langsung dari database.'
      );
    }

    // 3. WHO AM I / USER PROFILE QUESTIONS
    if (
      /siapa\s*saya|nama\s*saya|akun\s*saya|profil\s*saya|data\s*saya|email\s*saya/i.test(q) &&
      !q.includes('admin')
    ) {
      if (raw?.userName) {
        return (
          `👤 **Data Akun Anda (Berdasarkan Database):**\n\n` +
          `• **Nama**: ${raw.userName}\n` +
          `• **Email**: ${raw.userEmail}\n` +
          `• **Nomor Telepon**: ${raw.userPhone || 'Belum diisi'}\n` +
          `• **Peran**: ${raw.userRole}\n` +
          `• **Pesanan Aktif**: ${raw.activeOrders.length} pesanan\n\n` +
          `Ada yang ingin Anda cek terkait pesanan atau invoice Anda?`
        );
      }
    }

    // 4. QUESTIONS ABOUT ORDERS / STATUS PESANAN
    if (
      /pesanan|order|servis\s*saya|status\s*servis|laptop\s*saya\s*gimana|progres|perkembangan|sudah\s*jadi|kapan\s*selesai|siap\s*diambil/i.test(q)
    ) {
      if (isAdmin) {
        // Admin: ringkasan seluruh pesanan sistem
        const recent = raw?.recentOrders || [];
        const pending = raw?.pendingApprovals || [];
        if (/menunggu\s*(approval|persetujuan)/i.test(q)) {
          if (pending.length === 0) {
            return 'Tidak ada pesanan yang sedang menunggu approval customer.';
          }
          return (
            `**Pesanan yang menunggu approval customer (${pending.length}):**\n\n` +
            pending
              .map(
                (o) =>
                  `- **${o.orderNumber}** | ${o.customerName} | ${o.serviceName} | Estimasi: ${
                    o.estimatedCost !== undefined ? `Rp ${o.estimatedCost.toLocaleString('id-ID')}` : '-'
                  }`
              )
              .join('\n')
          );
        }

        // Pertanyaan spesifik: Berapa pesanan yang sedang diproses / dikerjakan / diagnosa
        if (/sedang\s*(diproses|dikerjakan|proses)|dalam\s*pengerjaan/i.test(q)) {
          const inProg = raw?.ordersByStatus?.['IN_PROGRESS'] || 0;
          const diag = raw?.ordersByStatus?.['DIAGNOSING'] || 0;
          const req = raw?.ordersByStatus?.['REQUESTED'] || 0;
          const activeTotal = raw?.activeOrdersCount ?? (inProg + diag + req);
          return (
            `🔧 **Jumlah Pesanan yang Sedang Diproses:**\n\n` +
            `- **Sedang Dikerjakan (IN_PROGRESS)**: **${inProg} pesanan**\n` +
            `- **Sedang Didiagnosa (DIAGNOSING)**: **${diag} pesanan**\n` +
            `- **Menunggu Konfirmasi (REQUESTED)**: **${req} pesanan**\n` +
            `- **Total Pesanan Aktif Berjalan**: **${activeTotal} pesanan**\n\n` +
            `*Data diambil secara real-time dari database pesanan TechCare.*`
          );
        }

        // Pertanyaan spesifik: Berapa pesanan yang sudah selesai
        if (/sudah\s*selesai|pesanan\s*selesai|yang\s*selesai/i.test(q)) {
          const comp = raw?.completedOrdersCount ?? (raw?.ordersByStatus?.['COMPLETED'] || 0);
          const ready = raw?.ordersByStatus?.['READY'] || 0;
          return (
            `🎉 **Jumlah Pesanan yang Sudah Selesai:**\n\n` +
            `- **Selesai & Unit Diambil (COMPLETED)**: **${comp} pesanan**\n` +
            `- **Selesai Siap Diambil (READY)**: **${ready} pesanan**\n\n` +
            `*Data diambil secara real-time dari database pesanan TechCare.*`
          );
        }

        const breakdown = raw?.ordersByStatus
          ? Object.entries(raw.ordersByStatus)
              .map(([status, count]) => `   - ${status}: ${count} pesanan`)
              .join('\n')
          : '';

        const recentList = recent
          .slice(0, /terbaru|terakhir|masuk|terkini/i.test(q) ? 8 : 5)
          .map(
            (o) =>
              `- **${o.orderNumber}** | ${o.customerName} | ${o.serviceName} (${o.device})\n  Status: **${o.statusLabel}** | Masuk: ${new Date(
                o.createdAt
              ).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
          )
          .join('\n');

        return (
          `**Ringkasan pesanan sistem (data real-time):**\n\n` +
          `- Total pesanan: **${raw?.totalOrders ?? '?'}**\n` +
          `- Pesanan aktif: **${raw?.activeOrdersCount ?? '?'}**\n` +
          (breakdown ? `\nBreakdown per status:\n${breakdown}\n\n` : '\n') +
          `**Pesanan terbaru:**\n${recentList || 'Belum ada data.'}\n\n` +
          `*Informasi diambil langsung dari database TechCare (mode admin).*`
        );
      }
      if (raw && raw.activeOrders.length > 0) {
        const orderDetails = raw.activeOrders
          .map((o) => {
            return (
              `📋 **Pesanan #${o.orderNumber}**\n` +
              `• **Layanan**: ${o.serviceName}\n` +
              `• **Perangkat**: ${o.device}\n` +
              `• **Status Terkini**: **${o.statusLabel}**\n` +
              `• **Teknisi**: ${o.technicianName || 'Sedang dialokasikan'}\n` +
              `• **Estimasi Biaya**: ${o.estimatedCost ? `Rp ${o.estimatedCost.toLocaleString('id-ID')}` : 'Sedang dihitung'}\n` +
              (o.notes ? `• **Catatan Teknisi**: "${o.notes}"\n` : '') +
              (o.invoiceNumber
                ? `• **Invoice**: ${o.invoiceNumber} (Status: ${o.paymentStatus === 'PAID' ? '✅ Lunas' : '❌ Belum Lunas'})\n`
                : '')
            );
          })
          .join('\n---\n\n');

        return (
          `Berikut adalah **data pesanan aktif Anda** yang tercatat di database:\n\n` +
          `${orderDetails}\n\n` +
          `*Informasi di atas diambil langsung secara real-time dari database TechCare.*`
        );
      } else if (raw && raw.completedOrders.length > 0) {
        const comp = raw.completedOrders[0];
        return (
          `Saat ini Anda tidak memiliki pesanan yang sedang berjalan. Namun ada riwayat pesanan sebelumnya:\n\n` +
          `📋 **Pesanan #${comp.orderNumber}** (${comp.serviceName} - ${comp.device})\n` +
          `Status: **${comp.statusLabel}**\n\n` +
          `Apakah Anda ingin membuat service request baru untuk perangkat lain?`
        );
      } else if (raw?.userName) {
        return (
          `Berdasarkan data di database kami, Anda belum memiliki pesanan servis yang sedang aktif.\n\n` +
          `Jika Anda mengalami kendala pada komputer atau laptop, Anda dapat membuat **Service Request** baru melalui menu layanan kami.`
        );
      }
    }

    // 5. QUESTIONS ABOUT INVOICE & TAGIHAN
    if (
      /invoice|tagihan|biaya\s*yang\s*harus\s*dibayar|pembayaran|bayar\s*berapa|total\s*biaya/i.test(q)
    ) {
      if (isAdmin) {
        const unpaid = raw?.unpaidInvoiceList || [];
        if (/belum\s*dibayar|tertunggak|outstanding|unpaid/i.test(q)) {
          if (unpaid.length === 0) {
            return 'Tidak ada invoice yang belum dibayar. Semua invoice sudah lunas.';
          }
          return (
            `**Invoice belum dibayar (${unpaid.length} terbaru):**\n\n` +
            unpaid
              .map(
                (inv) =>
                  `- **${inv.invoiceNumber}** (Pesanan: ${inv.orderNumber}) | ${inv.customerName || 'Customer'} | Total: **Rp ${inv.total.toLocaleString('id-ID')}**`
              )
              .join('\n')
          );
        }
        if (/verifikasi|pending/i.test(q)) {
          return (
            `**Status verifikasi & keuangan:**\n\n` +
            `- Invoice menunggu verifikasi pembayaran: **${raw?.totalInvoicesPending ?? '?'}** invoice\n` +
            `- Invoice belum dibayar: **${raw?.totalInvoicesUnpaid ?? '?'}** invoice\n` +
            `- Total pendapatan (PAID): **Rp ${(raw?.totalRevenue ?? 0).toLocaleString('id-ID')}**`
          );
        }
        return (
          `**Ringkasan keuangan TechCare (real-time):**\n\n` +
          `- Total pesanan sistem: **${raw?.totalOrders ?? '?'}**\n` +
          `- Invoice belum dibayar: **${raw?.totalInvoicesUnpaid ?? '?'}**\n` +
          `- Menunggu verifikasi: **${raw?.totalInvoicesPending ?? '?'}**\n` +
          `- Total pendapatan (PAID): **Rp ${(raw?.totalRevenue ?? 0).toLocaleString('id-ID')}**` +
          (unpaid.length
            ? `\n\n**Invoice belum dibayar:**\n` +
              unpaid
                .map(
                  (inv) =>
                    `- ${inv.invoiceNumber} | ${inv.customerName || 'Customer'} | Rp ${inv.total.toLocaleString('id-ID')}`
                )
                .join('\n')
            : '')
        );
      }
      if (raw && raw.invoices.length > 0) {
        const invoiceDetails = raw.invoices
          .map((inv) => {
            return (
              `🧾 **Invoice #${inv.invoiceNumber}** (Pesanan: ${inv.orderNumber})\n` +
              `• **Total Tagihan**: **Rp ${inv.total.toLocaleString('id-ID')}**\n` +
              `• **Status Pembayaran**: **${inv.paymentStatusLabel}**\n` +
              (inv.paymentMethod ? `• **Metode**: ${inv.paymentMethod}\n` : '')
            );
          })
          .join('\n---\n\n');

        return (
          `Berikut adalah **rincian invoice & tagihan Anda** dari database:\n\n` +
          `${invoiceDetails}\n\n` +
          `Pembayaran dapat dilakukan melalui **Tunai (Cash)** di kasir workshop atau **Transfer Bank**. ` +
          `Rincian invoice lengkap dapat dilihat pada menu **Invoice** akun Anda.`
        );
      } else if (raw?.userName) {
        return (
          `Berdasarkan database, Anda saat ini **tidak memiliki tagihan atau invoice yang tertunggak**.\n\n` +
          `Jika baru saja membuat service request, invoice akan diterbitkan setelah proses diagnosis atau pengerjaan disepakati.`
        );
      }
    }

    // 6. QUESTIONS ABOUT SERVICES & PRICING
    if (
      /daftar\s*layanan|layanan\s*apa\s*saja|bisa\s*servis\s*apa|harga\s*layanan|biaya\s*servis|pricelist|katalog/i.test(q)
    ) {
      if (raw && raw.services.length > 0) {
        const servicesList = raw.services
          .map(
            (s) =>
              `• **${s.name}** (${s.category})\n  Mulai dari: **Rp ${s.priceFrom.toLocaleString('id-ID')}** | Estimasi: ${s.estimatedDuration}`
          )
          .join('\n\n');

        return (
          `🛠️ **Daftar Layanan Resmi TechCare IT Services (Database):**\n\n` +
          `${servicesList}\n\n` +
          `Harga final dapat bervariasi tergantung tipe suku cadang dan tingkat kesulitan pengerjaan.`
        );
      }
    }

    // 7. COUNTING DATA QUERIES
    // Patterns: "total pengguna", "total pelanggan", "total produk", "total transaksi", "total pesanan", "jumlah data dalam setiap tabel", "total teknisi", "teknisi yang terdaftar"
    if (
      /total\s*(pengguna|user|akun)|jumlah\s*(pengguna|user|akun)|daftar\s*(pengguna|user|akun)/i.test(q) ||
      /total\s*pelanggan|jumlah\s*pelanggan|pelanggan\s*terdaftar|semua\s*pelanggan/i.test(q) ||
      /total\s*produk|total\s*layanan|jumlah\s*layanan|layanan\s*terdaftar|semua\s*layanan/i.test(q) ||
      /total\s*transaksi|total\s*pesanan|jumlah\s*pesanan|pesanan\s*semua|total\s*data/i.test(q) ||
      /jumlah\s*data\s*dalam|data\s*dalam\s*setiap\s*tabel|setiap\s*tabel\s*jumlah/i.test(q) ||
      /total\s*teknisi|jumlah\s*teknisi|daftar\s*teknisi|siapa\s*(saja\s*)?teknisi|teknisi\s*(yang\s*)?terdaftar/i.test(q) ||
      /pendapatan|revenue|omset|omzet|penghasilan|keuangan/i.test(q)
    ) {
      // Restricted metrics (pengguna, pelanggan, transaksi, invoice unpaid, pendapatan, tabel): ADMIN only.
      // Layanan & daftar teknisi publik boleh dijawab siapa pun.
      const onlyPublicMetrics =
        /layanan|produk|service/i.test(q) &&
        !/(pelanggan|customer|pengguna|transaksi|pesanan|invoice|pendapatan|revenue|omset|omzet|penghasilan|keuangan|tabel|user)/i.test(q);
      
      const isTechInquiry = /siapa\s*(saja\s*)?teknisi|teknisi\s*(yang\s*)?terdaftar|daftar\s*teknisi|total\s*teknisi|jumlah\s*teknisi/i.test(q);

      if (!isAdmin && !onlyPublicMetrics && !isTechInquiry) {
        return internalDataRefusal;
      }

      // Khusus pertanyaan siapa saja teknisi yang terdaftar / daftar teknisi
      if (/siapa\s*(saja\s*)?teknisi|teknisi\s*(yang\s*)?terdaftar|daftar\s*teknisi|tim\s*teknisi/i.test(q)) {
        if (raw?.techniciansList && raw.techniciansList.length > 0) {
          const list = raw.techniciansList
            .map((t, i) => `${i + 1}. **${t.name}**\n   - Spesialisasi: ${t.specialization}\n   - Kontak: ${t.phone}${isAdmin ? `\n   - Pesanan Ditugaskan: ${t.assignedOrdersCount} pesanan` : ''}`)
            .join('\n\n');
          return `👨‍🔧 **Tim Teknisi Resmi TechCare (${raw.techniciansList.length} teknisi terdaftar):**\n\n${list}\n\n*Data diambil langsung dari database TechCare.*`;
        } else if (this.dbContext?.techniciansText) {
          return `👨‍🔧 **Tim Teknisi Resmi TechCare:**\n\n${this.dbContext.techniciansText}\n\n*Data diambil langsung dari database TechCare.*`;
        }
      }

      // Khusus pertanyaan tampilkan daftar pengguna / daftar customer (ADMIN only)
      if (/daftar\s*(pengguna|user|akun|pelanggan|customer)|tampilkan\s*(daftar\s*)?(pengguna|user|akun|pelanggan|customer)/i.test(q)) {
        if (!isAdmin) return internalDataRefusal;
        if (raw?.customersList && raw.customersList.length > 0) {
          const list = raw.customersList
            .map((c, i) => `${i + 1}. **${c.name}** (${c.email})\n   - No. Telepon: ${c.phone || '-'}\n   - Alamat: ${c.address || '-'}\n   - Total Pesanan: **${c.orderCount} pesanan**`)
            .join('\n\n');
          return `👥 **Daftar Pengguna / Pelanggan Terdaftar (${raw.totalCustomers} orang):**\n\n${list}\n\n*Data aktual diambil langsung dari database sistem.*`;
        }
      }

      // Khusus pertanyaan total pengguna / total user (ADMIN only)
      if (/total\s*(pengguna|user|akun)|ada\s*berapa\s*(total\s*)?(pengguna|user|akun)|jumlah\s*(pengguna|user|akun)/i.test(q)) {
        if (!isAdmin) return internalDataRefusal;
        const totalU = raw?.totalUsers ?? '?';
        const totalC = raw?.totalCustomers ?? '?';
        return `👥 **Total Pengguna Terdaftar di Sistem:**\n\n- **Total Pengguna**: **${totalU} akun**\n- Rincian: **${totalC} pelanggan (customer)** dan **1 Super Admin**.\n\n*Data diambil secara langsung dari database sistem TechCare.*`;
      }

      // Khusus pertanyaan total teknisi yang terdaftar
      if (/ada\s*berapa\s*teknisi|total\s*teknisi|jumlah\s*teknisi/i.test(q)) {
        const totalTech = raw?.totalTechnicians ?? (raw?.techniciansList?.length || 0);
        return `👨‍🔧 **Total Teknisi Terdaftar di TechCare:**\n\nSaat ini terdapat **${totalTech} teknisi resmi** yang aktif bertugas.\n\nKetik *"Siapa saja teknisi yang terdaftar?"* untuk melihat rincian nama dan spesialisasi masing-masing teknisi.`;
      }

      let response = '📊 **Ringkasan Data Database TechCare:**\n\n';

      // Total pelanggan/customers
      if (/total\s*pelanggan|jumlah\s*pelanggan|pelanggan\s*terdaftar|semua\s*pelanggan/i.test(q) || q.includes('jumlah data pelanggan')) {
        const totalCustomers = metrics?.totalCustomers !== undefined ? metrics.totalCustomers : '?';
        response += `• **Total Pelanggan Terdaftar**: ${totalCustomers} orang\n`;
      }

      // Daftar pelanggan
      if (/daftar\s*pelanggan|daftar\s*pelanggan|pelanggan\s*terdaftar/i.test(q)) {
        const techCount = metrics?.totalCustomers !== undefined ? metrics.totalCustomers : '?';
        response += `• **Daftar Pelanggan**: ${techCount} pelanggan terdaftar\n`;
        response += `  (Lihat daftar lengkap pelanggan pada menu Customers di admin panel.)\n`;
      }

      // Daftar teknisi
      if (/daftar\s*teknisi|daftar\s*teknisi|teknisi\s*terdaftar|daftar\s*tim\s*teknisi/i.test(q)) {
        const techCount = metrics?.totalTechnicians !== undefined ? metrics.totalTechnicians : '?';
        response += `• **Daftar Teknisi**: ${techCount} teknisi aktif\n`;
        response += `  (Lihat daftar lengkap teknisi beserta spesialisasinya pada menu Technicians di admin panel.)\n`;
      }

      // Total produk/layanan
      if (/total\s*produk|total\s*layanan|jumlah\s*layanan|layanan\s*terdaftar|semua\s*layanan/i.test(q) || q.includes('jumlah layanan')) {
        const totalServices = metrics?.totalServices !== undefined ? metrics.totalServices : '?';
        response += `• **Total Layanan Aktif**: ${totalServices} layanan\n`;
      }

      // Total transaksi/pesanan
      if (/total\s*transaksi|total\s*pesanan|jumlah\s*pesanan|pesanan\s*semua|total\s*data/i.test(q) || q.includes('total pesanan') || q.includes('total transaksi')) {
        const totalOrders = metrics?.totalOrders !== undefined ? metrics.totalOrders : '?';
        response += `• **Total Pesanan/Transaksi**: ${totalOrders} pesanan\n`;
      }

      // Pesanan berdasarkan status
      if (/pesanan\s*baru|baru\s*pesanan|request\s*baru|pesanan\s*baru\s*terdaftar|status\s*pesanan/i.test(q) || q.includes('pesanan baru') || q.includes('pesanan request')) {
        const activeCount = metrics?.activeOrders?.length || 0;
        response += `• **Pesanan Baru/Sedang Dikerjakan**: ${activeCount} pesanan\n`;
      }

      // Pesanan selesai
      if (/pesanan\s*selesai|selesai\s*pesanan|riwayat\s*pesanan|pesanan\s*selesai\s*tercatat/i.test(q) || q.includes('pesanan selesai') || q.includes('riwayat pesanan')) {
        const completedCount = metrics?.completedOrders?.length || 0;
        response += `• **Pesanan Selesai/Tercatat**: ${completedCount} pesanan\n`;
      }

      // Total invoice belun dibayar
      if (/invoice\s*belum\s*dibayar|invoice\s*belum|belum\s*lunas|invoice\s*belum\s*terbayar/i.test(q) || q.includes('invoice belum')) {
        const unpaidInvoices = metrics?.totalInvoicesUnpaid !== undefined ? metrics.totalInvoicesUnpaid : '?';
        response += `• **Invoice Belum Dibayar**: ${unpaidInvoices} invoice\n`;
      }

      // Total pendapatan/penghasilan
      if (/total\s*pendapatan|total\s*pendapatan|pendapatan|total\s*keuangan|revenue|penghasilan/i.test(q) || q.includes('total pendapatan')) {
        const totalRevenue = metrics?.totalRevenue !== undefined ? `Rp ${metrics.totalRevenue.toLocaleString('id-ID')}` : '?';
        response += `• **Total Pendapatan**: ${totalRevenue}\n`;
      }

      // Total teknisi
      if (/total\s*teknisi|jumlah\s*teknisi|daftar\s*teknisi/i.test(q) || q.includes('jumlah teknisi')) {
        const totalTechnicians = metrics?.totalTechnicians !== undefined ? metrics.totalTechnicians : '?';
        response += `• **Total Teknisi**: ${totalTechnicians} teknisi\n`;
      }

      // Jumlah data dalam setiap tabel
      if (/jumlah\s*data\s*dalam|data\s*dalam\s*setiap\s*tabel|setiap\s*tabel\s*jumlah/i.test(q)) {
        response += `• **Metadata Tersedia**: totalCustomers, totalServices, totalOrders, totalInvoicesUnpaid, totalRevenue\n`;
      }

      response += `\n*Informasi di atas diambil langsung dari database TechCare secara real-time.*`;
      return response;
    }

    // 8. SEARCHING DATA QUERIES
    // Patterns: "cari pelanggan", "cari produk", "cari transaksi berdasarkan tanggal"
    if (
      /cari\s*pelanggan|cari\s*pelanggan\s*berdasarkan|cari\s*pelanggan\s*nama|cari\s*pelanggan\s*ID/i.test(q) ||
      /cari\s*produk|cari\s*layanan|cari\s*layanan\s*berdasarkan|cari\s*layanan\s*nama|cari\s*layanan\s*kategori/i.test(q) ||
      /cari\s*transaksi|cari\s*pesanan|cari\s*pesanan\s*berdasarkan\s*tanggal|transaksi\s*berdasarkan\s*tanggal|pesanan\s*tanggal/i.test(q)
    ) {
      // Pencarian data pelanggan/transaksi hanya untuk admin; pencarian layanan bersifat publik.
      const searchesRestrictedData = /cari\s*(pelanggan|transaksi|pesanan|order|customer)|pelanggan\s*berdasarkan|transaksi\s*berdasarkan|pesanan\s*tanggal/i.test(q);
      if (searchesRestrictedData && !isAdmin) {
        return internalDataRefusal;
      }
      const qLower = q;
      let response = '🔍 **Hasil Pencarian Database TechCare:**\n\n';

      // Search customers by name or ID
      if (/cari\s*pelanggan|cari\s*pelanggan\s*berdasarkan|cari\s*pelanggan\s*nama|cari\s*pelanggan\s*ID/i.test(qLower) || qLower.includes('cari pelanggan')) {
        // Extract search term
        let searchTerm = qLower;
        const patterns = ['cari pelanggan berdasarkan', 'cari pelanggan nama', 'cari pelanggan ID', 'cari pelanggan'];
        patterns.forEach((pattern) => {
          searchTerm = searchTerm.replace(new RegExp(pattern, 'i'), '').trim();
        });

        // Remove common words
        searchTerm = searchTerm.replace(/^(seorang|seseorang|yang|orang)\s*/i, '').trim();

        if (searchTerm && searchTerm.length > 0) {
          // Try to match by name or ID - we'll search in active orders customer names
          const matchingOrders = metrics?.activeOrders?.filter((o) =>
            o.serviceName.toLowerCase().includes(searchTerm) ||
            o.device.toLowerCase().includes(searchTerm)
          ) || [];

          if (matchingOrders.length > 0) {
            response += `📋 **Ditemukan ${matchingOrders.length} hasil untuk **"${searchTerm}"**:\n\n`;
            const details = matchingOrders
              .slice(0, 5)
              .map((o) => {
                return `• **Pesanan #${o.orderNumber}**: ${o.serviceName} - ${o.device} - Status: ${o.statusLabel}`;
              })
              .join('\n');
            response += `${details}\n`;
          } else {
            response += `📋 **Tidak ditemukan pelanggan atau pesanan untuk: "${searchTerm}"**\n`;
            response += `Silakan coba mencari berdasarkan nama perangkat atau layanan.\n`;
          }
        } else {
          response += `📋 **Untuk mencari pelanggan, berikan nama atau ID yang dicari.**\n`;
          response += `Contoh: "Cari pelanggan bernama Budi" atau "Cari pelanggan ID C001"\n`;
        }
      }

      // Search products/services by name or category
      if (/cari\s*produk|cari\s*layanan|cari\s*layanan\s*nama|cari\s*layanan\s*kategori/i.test(qLower) || qLower.includes('cari produk') || qLower.includes('cari layanan')) {
        // Extract search term
        let searchTerm = qLower;
        const patterns = ['cari produk', 'cari layanan', 'cari layanan berdasarkan', 'cari layanan nama', 'cari layanan kategori'];
        patterns.forEach((pattern) => {
          searchTerm = searchTerm.replace(new RegExp(pattern, 'i'), '').trim();
        });

        if (raw?.services && raw.services.length > 0) {
          const searchResults = raw.services.filter(
            (s) => s.name.toLowerCase().includes(searchTerm) || (s.category && s.category.toLowerCase().includes(searchTerm))
          );

          if (searchResults.length > 0) {
            response += `🛠️ **Ditemukan ${searchResults.length} layanan untuk **"${searchTerm}"**:\n\n`;
            const details = searchResults
              .slice(0, 5)
              .map((s) => {
                return `• **${s.name}** (${s.category}) - Mulai dari: Rp ${s.priceFrom.toLocaleString('id-ID')}`;
              })
              .join('\n');
            response += `${details}\n`;
          } else {
            response += `🛠️ **Tidak ditemukan layanan untuk: "${searchTerm}"**\n`;
          }
        } else {
          response += `🛠️ **Katalog layanan sedang tidak tersedia**\n`;
        }
      }

      // Search transactions by date
      if (/cari\s*transaksi|cari\s*pesanan|cari\s*pesanan\s*berdasarkan\s*tanggal|transaksi\s*berdasarkan\s*tanggal|pesanan\s*tanggal/i.test(qLower) || qLower.includes('cari transaksi') || qLower.includes('cari pesanan')) {
        // Extract date pattern
        let dateTerm = qLower;
        const datePatterns = ['berdasarkan tanggal', 'tanggal', 'masa', 'bulan', 'tahun'];
        datePatterns.forEach((pattern) => {
          dateTerm = dateTerm.replace(new RegExp(pattern, 'i'), '').trim();
        });

        if (raw?.activeOrders && raw.activeOrders.length > 0) {
          // Try to filter by date if the order has a createdAt date
          response += `📋 **Pesanan ditemukan** (total: ${raw.activeOrders.length} pesanan aktif):\n\n`;
          const recentOrders = raw.activeOrders
            .slice(0, 5)
            .map((o) => {
              const dateStr = o.orderNumber ? o.orderNumber.substring(0, 8) : 'unknown';
              return `• **Pesanan #${o.orderNumber}**: ${o.serviceName} - Dibuat: ${dateStr} - Status: ${o.statusLabel}`;
            })
            .join('\n');
          response += `${recentOrders}\n`;
        } else if (raw?.completedOrders && raw.completedOrders.length > 0) {
          response += `📋 **Riwayat Pesanan** (total: ${raw.completedOrders.length} pesanan):\n\n`;
          const recentOrders = raw.completedOrders
            .slice(0, 5)
            .map((o) => {
              return `• **Pesanan #${o.orderNumber}**: ${o.serviceName} - Selesai: ${o.statusLabel}`;
            })
            .join('\n');
          response += `${recentOrders}\n`;
        } else {
          response += `📋 **Tidak ditemukan pesanan/transaksi** dengan kriteria yang ditentukan.\n`;
        }
      }

      return response;
    }

    // 9. ANALYSIS QUERIES
    // Patterns: "analisis data penjualan", "data terbanyak", "data paling sedikit", "membandingkan data berdasarkan periode"
    if (
      /analisis|analisis\s*data|data\s*penjualan|statistik|statistik\s*penjualan/i.test(q) ||
      /data\s*terbanyak|terbanyak|paling\s*banyak|paling\s*banyak\s*data|data\s*paling\s*populer/i.test(q) ||
      /data\s*terkurang|terkurang|paling\s*sedikit|paling\s*kecil|data\s*paling\s*sedikit/i.test(q) ||
      /membandingkan|perbandingan|compare|perbedaan|perubahan/i.test(q) &&
      (/bulan|periode|waktu|time|tahun|selisih/i.test(q) || q.includes('membandingkan') || q.includes('perbandingan'))
    ) {
      // Analisis bisnis (penjualan/pendapatan/perbandingan/statistik): ADMIN only.
      if (!isAdmin) {
        return internalDataRefusal;
      }
      const metrics = raw;

      let response = '📈 **Analisis & Statistik Data TechCare:**\n\n';

      // Data terbanyak
      if (/data\s*terbanyak|terbanyak|paling\s*banyak|paling\s*banyak\s*data/i.test(q)) {
        if (metrics?.totalOrders && metrics.totalOrders > 0) {
          response += `• **Data Paling Banyak**: ${metrics.totalOrders} pesanan tercatat\n`;
        }
        if (metrics?.totalServices && metrics?.totalServices > 0) {
          const totalOrders = metrics?.totalOrders ?? 0;
          response += `• **Layanan Paling Populer**: Dibutuhkan untuk ${totalOrders > 0 ? 'analisis lebih lanjut' : 'tidak ada data'}\n`;
        }
      }

      // Data paling sedikit/kurang
      if (/data\s*terkurang|terkurang|paling\s*sedikit|paling\s*kecil|data\s*paling\s*sedikit/i.test(q)) {
        if (metrics?.totalInvoicesUnpaid !== undefined) {
          response += `• **Data Paling Sedikit**: ${metrics.totalInvoicesUnpaid} invoice belum dibayar\n`;
        }
      }

      // Comparison/Comparison between periods
      if (/membandingkan|perbandingan|compare|perbedaan|perubahan/i.test(q) && (/bulan|periode|waktu|time|tahun/i.test(q) || q.includes('membandingkan'))) {
        response += `📊 **Perbandingan Periode**:\n`;
        response += `• **Total Pelanggan**: ${metrics?.totalCustomers !== undefined ? metrics.totalCustomers : '?'}\n`;
        response += `• **Total Pesanan**: ${metrics?.totalOrders !== undefined ? metrics.totalOrders : '?'}\n`;
        response += `• **Total Pendapatan**: ${metrics?.totalRevenue !== undefined ? `Rp ${metrics.totalRevenue.toLocaleString('id-ID')}` : '?'}\n`;
        response += `• **Invoice Belum Bayar**: ${metrics?.totalInvoicesUnpaid !== undefined ? metrics.totalInvoicesUnpaid : '?'}\n`;
        response += `\n*Untuk perbandingan yang lebih detail berdasarkan bulan/tahun spesifik, bisa dilakukan dengan query database langsung.*\n`;
      }

      // Sales analysis
      if (/analisis\s*data\s*penjualan|data\s*penjualan|statistik\s*penjualan/i.test(q)) {
        response += `💰 **Analisis Penjualan**:\n`;
        if (metrics?.totalRevenue !== undefined) {
          response += `• **Total Pendapatan**: ${metrics.totalRevenue.toLocaleString('id-ID')}\n`;
        }
        if (metrics?.totalOrders !== undefined) {
          response += `• **Total Transaksi**: ${metrics.totalOrders} pesanan\n`;
        }
        if (metrics?.totalCustomers !== undefined) {
          response += `• **Jumlah Pelanggan**: ${metrics.totalCustomers} klien\n`;
        }
        if (metrics?.totalServices !== undefined) {
          response += `• **Layanan Tersedia**: ${metrics.totalServices} kategori layanan\n`;
        }
        response += `\n*Data diambil langsung dari database TechCare.*\n`;
      }

      return response;
    }

    // 8. Multi-turn Diagnostic Follow-up Check
    const lastAssistantMsg = [..._history].reverse().find((m) => m.role === 'assistant')?.content.toLowerCase() || '';

    if (lastAssistantMsg.includes('lampu indikator') || lastAssistantMsg.includes('suara kipas')) {
      if (/tidak|nggak|gak|ga|mati|bukan|nihil|kosong|belum/i.test(q)) {
        return (
          'Baik. Kemungkinan masalah berada pada power supply, motherboard, atau komponen power lainnya. Saya sarankan pemeriksaan teknisi.\n\n' +
          'Apakah Anda ingin membuat service request?'
        );
      }
    }

    // 9. Problem: Komputer / PC / Laptop Tidak Mau Menyala (Interactive Initial Flow)
    if (/komputer.*tidak\s*mau\s*(menyala|nyala|hidup)|pc.*tidak\s*mau\s*(menyala|nyala|hidup)/i.test(q)) {
      return 'Baik. Apakah ada lampu indikator atau suara kipas ketika tombol power ditekan?';
    }

    // 10. Search matched articles from Knowledge Base (DB)
    const STOP_WORDS = new Set([
      'laptop', 'komputer', 'pc', 'saya', 'kamu', 'anda', 'yang', 'dan', 'di', 'ke', 'dari', 'ini', 'itu',
      'untuk', 'dengan', 'pada', 'adalah', 'bisa', 'tolong', 'mohon', 'bagaimana', 'kenapa', 'mengapa',
      'apakah', 'sangat', 'sekali', 'ada', 'mau', 'ingin', 'sudah', 'tapi', 'namun', 'apa', 'saja', 'tersebut',
      'berapa', 'total', 'jumlah', 'semua', 'orang', 'saja', 'lagi', 'keseluruhan', 'seluruhnya', 'daftar'
    ]);

    let bestArticle: KBArticleContext | null = null;
    let highestScore = 0;

    const keywords = q
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

    if (keywords.length > 0) {
      for (const article of this.kbArticles) {
        const titleLower = article.title.toLowerCase();
        const contentLower = article.content.toLowerCase();
        let score = 0;

        for (const kw of keywords) {
          if (titleLower.includes(kw)) score += 4;
          if (contentLower.includes(kw)) score += 1;
        }

        if (score > highestScore && score >= 4) {
          highestScore = score;
          bestArticle = article;
        }
      }
    }

    if (bestArticle && highestScore >= 3) {
      return (
        `Berdasarkan data Knowledge Base kami terkait **${bestArticle.title}**:\n\n` +
        `${bestArticle.content}\n\n` +
        `*Catatan: Langkah di atas merupakan panduan awal dan kemungkinan penyebab. Jika membutuhkan penanganan fisik atau penggantian suku cadang, silakan jadwalkan konsultasi dengan teknisi kami.*`
      );
    }

    // 11. Troubleshooting: Lambat
    if (/lambat|lemot|slow|lelet|berat|lag|hang|freeze/i.test(q) && /laptop|pc|komputer|windows|kompi/i.test(q)) {
      return (
        'Beberapa kemungkinan penyebab laptop/komputer Anda sangat lambat antara lain:\n\n' +
        '1. **Kapasitas Penyimpanan Penuh**: Ruang harddisk/SSD yang hampir habis menghambat virtual memory sistem.\n' +
        '2. **Keterbatasan RAM**: Banyak aplikasi berjalan bersamaan di latar belakang melebihi kapasitas memori fisik.\n' +
        '3. **Startup Applications Berlebihan**: Terlalu banyak program yang otomatis berjalan saat Windows booting.\n' +
        '4. **Masalah Kesehatan Harddisk (HDD Bad Sector)**: Piringan harddisk mekanik yang aus atau mulai rusak.\n' +
        '5. **Adanya Malware atau Virus**: Proses tersembunyi yang menguras penggunaan CPU hingga 100%.\n\n' +
        '💡 **Troubleshooting Sederhana yang Dapat Anda Coba Sendiri:**\n' +
        '- Tekan `Ctrl + Shift + Esc` (Task Manager), buka tab **Startup**, lalu nonaktifkan aplikasi yang tidak penting.\n' +
        '- Jalankan **Disk Cleanup** untuk membersihkan file sementara (temporary files).\n' +
        '- Lakukan restart perangkat secara normal.\n\n' +
        '⚠️ *Perhatian: Diagnosis ini merupakan perkiraan awal dan bukan kepastian mutlak. ' +
        'Jika setelah langkah di atas performa tetap berat, kami merekomendasikan pemeriksaan oleh teknisi atau upgrade SSD/RAM.*'
      );
    }

    // 12. Troubleshooting: Overheat
    if (/panas|overheat|kipas|berisik|kencang|hangat|suhu/i.test(q) && /laptop|pc|komputer/i.test(q)) {
      return (
        'Kemungkinan penyebab perangkat cepat panas (overheat) dan kipas berputar kencang:\n\n' +
        '1. **Debu Menumpuk pada Heatsink & Fan**: Ventilasi udara tersumbat sehingga panas terperangkap di dalam chasis.\n' +
        '2. **Thermal Paste Kering**: Senyawa penghantar panas antara processor/GPU dan pendingin sudah mengeras setelah 1-2 tahun.\n' +
        '3. **Beban Komputasi Ekstrem**: Proses latar belakang atau aplikasi berat yang terus menguras CPU.\n\n' +
        '💡 **Langkah Pencegahan Aman:**\n' +
        '- Gunakan laptop di atas permukaan datar yang keras (hindari kasur, bantal, atau selimut).\n' +
        '- Pastikan lubang ventilasi samping dan bawah tidak tertutup.\n\n' +
        '⚠️ *Kami menyarankan layanan Deep Cleaning & Penggantian Thermal Paste profesional oleh teknisi kami.*'
      );
    }

    // 13. Troubleshooting: Mati Total
    if (/mati\s*total|tidak\s*mau\s*(hidup|nyala|menyala)|no\s*power|matot/i.test(q)) {
      return (
        'Jika laptop atau PC tidak menyala sama sekali, beberapa kemungkinan penyebabnya:\n\n' +
        '1. **Adapter / Charger Bermasalah**: Kabel putus di dalam atau adaptor tidak mengeluarkan daya yang sesuai.\n' +
        '2. **Baterai Rusak atau Habis Total**: Baterai drop hingga proteksi BMS memutus arus.\n' +
        '3. **Arus Listrik Statis Tertahan**: Komponen motherboard berada dalam kondisi terkunci (power lock).\n' +
        '4. **Korsleting Jalur Motherboard**: Kerusakan IC Power atau kapasitor yang short.\n\n' +
        '💡 **Troubleshooting Awal yang Aman:**\n' +
        '- Cabut semua perangkat USB, flashdisk, dan kabel charger.\n' +
        '- Tahan tombol Power selama 30-40 detik (Power Drain/Hard Reset).\n' +
        '- Hubungkan kembali charger langsung ke stopkontak dinding.\n' +
        '- Coba tekan tombol power sekali lagi dan perhatikan indikator lampu LED.\n\n' +
        'Apakah Anda ingin membuat service request untuk pemeriksaan lebih lanjut oleh teknisi kami?'
      );
    }

    // 14. Troubleshooting: BSOD
    if (/blue\s*screen|bsod|layar\s*biru|restart\s*sendiri|crash/i.test(q)) {
      return (
        'Penyebab umum Blue Screen of Death (BSOD) atau restart mendadak pada komputer:\n\n' +
        '1. **Driver Korup atau Bentrok**: Terutama driver kartu grafis (GPU) atau chipset.\n' +
        '2. **Kerusakan Memori RAM**: Sektor memori RAM yang tidak stabil saat membaca data.\n' +
        '3. **File Sistem Windows Rusak**: Akibat mati mendadak saat update sistem.\n' +
        '4. **Suhu Terlalu Tinggi**: Mekanisme proteksi otomatis hardware mematikan sistem.\n\n' +
        '💡 **Langkah Troubleshooting Awal:**\n' +
        '- Buka Command Prompt sebagai Administrator, ketik: `sfc /scannow` lalu tekan Enter.\n' +
        '- Ketik `Windows Memory Diagnostic` pada Start Menu untuk menguji kesehatan RAM.\n\n' +
        'Pemeriksaan lebih mendalam oleh teknisi disarankan jika BSOD terjadi berulang kali.'
      );
    }

    // 15. FAQ: Jam Operasional
    if (/jam\s*(kerja|buka|operasional|toko)|hari\s*buka|kapan\s*buka/i.test(q)) {
      return (
        '📅 **Jam Operasional TechCare IT Services:**\n\n' +
        '- **Senin - Sabtu**: 08:30 - 20:00 WIB\n' +
        '- **Minggu**: 10:00 - 16:00 WIB\n' +
        '- **Hari Libur Nasional**: Tetap menerima konsultasi AI dan pemesanan online 24 jam.\n\n' +
        'Anda dapat mengajukan permohonan service request kapan saja melalui menu **Service Request** di portal customer.'
      );
    }

    // 16. FAQ: Garansi
    if (/garansi|warranty|jaminan/i.test(q)) {
      return (
        '🛡️ **Kebijakan Garansi Servis TechCare:**\n\n' +
        '- **Servis Hardware / Penggantian Komponen**: Garansi 30 hingga 90 hari (tergantung suku cadang).\n' +
        '- **Servis Motherboard & IC Power**: Garansi 30 hari.\n' +
        '- **Instalasi Software & Pemulihan Sistem**: Garansi 14 hari.\n' +
        '- Garansi mencakup kendala berulang pada bagian yang sama dan bebas biaya jasa teknisi.'
      );
    }

    // 17. FAQ: Cara Pemesanan
    if (/cara\s*(pesan|order|booking|request|daftar)|bagaimana\s*(pesan|order)|service\s*request/i.test(q)) {
      return (
        '📋 **Cara Mudah Melakukan Pemesanan Service:**\n\n' +
        '1. Buka menu **Service Request** pada dashboard customer atau klik tombol rekomendasi di bawah.\n' +
        '2. Pilih kategori layanan yang sesuai dengan keluhan Anda.\n' +
        '3. Masukkan detail perangkat (Tipe, Merek, Model) dan deskripsi masalah.\n' +
        '4. Pilih jadwal pengerjaan yang diinginkan.\n' +
        '5. Tim kami akan segera meninjau dan menetapkan teknisi terbaik untuk perangkat Anda.'
      );
    }

    // 18. Default fallback
    return 'Informasi tersebut belum tersedia. Saya sarankan menghubungi admin kami atau mengajukan Service Request untuk dibantu langsung oleh tim teknisi kami.';
  }
}
