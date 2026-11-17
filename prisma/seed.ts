import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seeding...');

  // 1. Clean existing records in reverse dependency order
  await prisma.invoice.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.technician.deleteMany();
  await prisma.service.deleteMany();
  await prisma.knowledgeBase.deleteMany();
  await prisma.user.deleteMany();

  // Password hashes
  const adminPassword = await bcrypt.hash('AdminPassword123!', 10);
  const customerPassword = await bcrypt.hash('Customer123!', 10);

  // 2. Seed Admin User
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin IT',
      email: 'admin@techcare.id',
      password: adminPassword,
      role: 'ADMIN',
      phone: '081234567890',
    },
  });
  console.log(`✅ Seeded Admin: ${admin.email}`);

  // 3. Seed Customers & Profiles
  const customerBudi = await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      email: 'budi@gmail.com',
      password: customerPassword,
      role: 'CUSTOMER',
      phone: '081298765432',
      profile: {
        create: {
          address: 'Jl. Sudirman No. 45, Jakarta Selatan',
        },
      },
    },
  });

  const customerSiti = await prisma.user.create({
    data: {
      name: 'Siti Rahma',
      email: 'siti@gmail.com',
      password: customerPassword,
      role: 'CUSTOMER',
      phone: '081345678901',
      profile: {
        create: {
          address: 'Jl. Diponegoro No. 12, Bandung',
        },
      },
    },
  });

  const customerHendra = await prisma.user.create({
    data: {
      name: 'Hendra Wijaya',
      email: 'hendra@gmail.com',
      password: customerPassword,
      role: 'CUSTOMER',
      phone: '081765432109',
      profile: {
        create: {
          address: 'Jl. Malioboro No. 88, Yogyakarta',
        },
      },
    },
  });
  console.log('✅ Seeded 3 Customers with profiles');

  // 4. Seed Services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Diagnosa & Deep Cleaning Hardware',
        category: 'Hardware Maintenance',
        description:
          'Pembersihan menyeluruh debu fan/heatsink, penggantian thermal paste premium (Artic MX-4 / Kryonaut), dan monitoring suhu termal.',
        priceFrom: 150000,
        estimatedDuration: '1 Hari',
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Perbaikan Motherboard & Penggantian IC Power',
        category: 'Hardware Repair',
        description:
          'Penanganan laptop mati total, korsleting jalur VCore/3V-5V, reballing chipset, dan penggantian komponen kapasitor/mosfet.',
        priceFrom: 450000,
        estimatedDuration: '2-4 Hari',
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Instalasi OS & Optimasi Sistem IT',
        category: 'Software & OS',
        description:
          'Instalasi Windows 11 / macOS / Linux, driver hardware terbaru, update patch keamanan, antivirus, dan optimasi performa boot.',
        priceFrom: 100000,
        estimatedDuration: '2-3 Jam',
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Data Recovery Storage (HDD / SSD Corrupt)',
        category: 'Data Services',
        description:
          'Penyelamatan file dari harddisk bad sector, SSD corrupt/tidak terdeteksi, partisi terformat secara tidak sengaja.',
        priceFrom: 500000,
        estimatedDuration: '2-5 Hari',
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Upgrade SSD NVMe & RAM High Speed',
        category: 'Hardware Upgrade',
        description:
          'Pemasangan NVMe M.2 SSD kecepatan tinggi, migrasi/cloning OS tanpa hilang data, dan penambahan dual-channel RAM.',
        priceFrom: 75000,
        estimatedDuration: '1-2 Jam',
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Seeded ${services.length} Services`);

  // 5. Seed Technicians
  const technicians = await Promise.all([
    prisma.technician.create({
      data: {
        name: 'Ahmad Fauzi',
        phone: '085611223344',
        specialization: 'Motherboard, Power Circuit & Micro-soldering',
        isActive: true,
      },
    }),
    prisma.technician.create({
      data: {
        name: 'Dian Pratama',
        phone: '085722334455',
        specialization: 'Software Architecture, OS, Networking & macOS',
        isActive: true,
      },
    }),
    prisma.technician.create({
      data: {
        name: 'Rizky Ramadhan',
        phone: '085833445566',
        specialization: 'Data Recovery Forensic & Storage Diagnostics',
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Seeded ${technicians.length} Technicians`);

  // 6. Seed Knowledge Base Articles
  const kbArticles = await Promise.all([
    prisma.knowledgeBase.create({
      data: {
        title: 'Cara Mengatasi Laptop Tidak Mau Menyala (No Power / Mati Total)',
        category: 'Hardware Troubleshooting',
        content:
          '1. Lepas charger dan perangkat eksternal (USB, mouse).\n2. Jika baterai dapat dilepas, lepas baterai lalu tekan tahan tombol Power selama 30 detik (Hard Reset/Power Drain).\n3. Colokkan charger kembali dan amati lampu indikator LED.\n4. Jika lampu charger tidak menyala sama sekali, coba adapter charger lain yang sesuai spesifikasi.\n5. Bila tetap tidak merespons, kemungkinan terjadi short-circuit pada power rail motherboard dan membutuhkan pengecekan teknisi.',
        isPublished: true,
      },
    }),
    prisma.knowledgeBase.create({
      data: {
        title: 'Penyebab Laptop Cepat Panas (Overheat) & Kipas Berputar Kencang',
        category: 'Hardware Maintenance',
        content:
          'Overheating disebabkan oleh sirkulasi udara yang terhambat debu tebal pada sirip heatsink serta thermal paste processor yang telah mengering (biasanya setelah 1-2 tahun pemakaian). Solusi: Bersihkan ventilasi udara secara berkala dan lakukan deep cleaning serta penggantian thermal paste berkualitas tinggi.',
        isPublished: true,
      },
    }),
    prisma.knowledgeBase.create({
      data: {
        title: 'Pertolongan Pertama Laptop Terkena Tumpahan Cairan (Water Spill)',
        category: 'Emergency Guide',
        content:
          'PERINGATAN PENTING: Segera cabut kabel listrik dan matikan paksa laptop dengan menahan tombol power. Balikkan laptop membentuk huruf V terbalik agar cairan mengalir keluar. JANGAN MENYALAKAN LAPTOP atau mengeringkannya dengan hairdryer panas. Segera bawa ke service center untuk ultrasonic cleaning agar tidak timbul korosi permanen pada komponen elektronik.',
        isPublished: true,
      },
    }),
    prisma.knowledgeBase.create({
      data: {
        title: 'Mengatasi Blue Screen of Death (BSOD) Kerap Muncul di Windows 11',
        category: 'Software & OS',
        content:
          'BSOD umumnya dipicu oleh bentrokan driver grafis/chipset atau kerusakan memori RAM. Langkah perbaikan:\n1. Masuk ke Safe Mode.\n2. Jalankan Windows Memory Diagnostic (`mdsched.exe`) untuk menguji modul RAM.\n3. Update driver kartu grafis ke versi WHQL terbaru.\n4. Jalankan perintah `sfc /scannow` pada Command Prompt (Admin) untuk memperbaiki file sistem yang korup.',
        isPublished: true,
      },
    }),
  ]);
  console.log(`✅ Seeded ${kbArticles.length} Knowledge Base Articles`);

  // 7. Seed Sample Orders & Invoices across different status stages
  const order1 = await prisma.serviceOrder.create({
    data: {
      orderNumber: 'SRV-2026-0001',
      customerId: customerBudi.id,
      serviceId: services[0].id, // Deep Cleaning
      technicianId: technicians[0].id,
      deviceType: 'Laptop Gaming',
      deviceBrand: 'Asus',
      deviceModel: 'ROG Strix G15 (G513)',
      problemDescription:
        'Suhu CPU mencapai 95C saat bermain game dan kipas berbunyi kasar.',
      preferredSchedule: '2026-09-05 Pagi (09:00 - 12:00)',
      status: 'IN_PROGRESS',
      estimatedCost: 150000,
      finalCost: 150000,
      notes: 'Sedang proses pembongkaran heatsink dan pembersihan liquid metal/paste.',
      invoice: {
        create: {
          invoiceNumber: 'INV-2026-0001',
          subtotal: 150000,
          discount: 0,
          total: 150000,
          paymentStatus: 'UNPAID',
        },
      },
    },
  });

  const order2 = await prisma.serviceOrder.create({
    data: {
      orderNumber: 'SRV-2026-0002',
      customerId: customerBudi.id,
      serviceId: services[4].id, // NVMe Upgrade
      technicianId: null,
      deviceType: 'Laptop',
      deviceBrand: 'Lenovo',
      deviceModel: 'IdeaPad Gaming 3',
      problemDescription:
        'Ingin pasang SSD NVMe 1TB Samsung 980 dan migrasi Windows tanpa install ulang file.',
      preferredSchedule: '2026-09-06 Siang (13:00 - 16:00)',
      status: 'REQUESTED',
      estimatedCost: 75000,
      finalCost: 75000,
      notes: null,
      invoice: {
        create: {
          invoiceNumber: 'INV-2026-0002',
          subtotal: 75000,
          discount: 0,
          total: 75000,
          paymentStatus: 'UNPAID',
        },
      },
    },
  });

  const order3 = await prisma.serviceOrder.create({
    data: {
      orderNumber: 'SRV-2026-0003',
      customerId: customerSiti.id,
      serviceId: services[2].id, // OS Install
      technicianId: technicians[1].id,
      deviceType: 'Laptop',
      deviceBrand: 'Apple',
      deviceModel: 'MacBook Air M1 (2020)',
      problemDescription: 'Ingin reinstall macOS Sonoma bersih dan install aplikasi desain.',
      preferredSchedule: '2026-09-01 Pagi',
      status: 'COMPLETED',
      estimatedCost: 100000,
      finalCost: 100000,
      notes: 'Instalasi OS Sonoma sukses, tes performa normal, unit telah diambil pelanggan.',
      invoice: {
        create: {
          invoiceNumber: 'INV-2026-0003',
          subtotal: 100000,
          discount: 0,
          total: 100000,
          paymentStatus: 'PAID',
        },
      },
    },
  });

  const order4 = await prisma.serviceOrder.create({
    data: {
      orderNumber: 'SRV-2026-0004',
      customerId: customerSiti.id,
      serviceId: services[1].id, // Motherboard Repair
      technicianId: technicians[0].id,
      deviceType: 'Laptop',
      deviceBrand: 'Lenovo',
      deviceModel: 'ThinkPad X1 Carbon Gen 8',
      problemDescription: 'Layar blank hitam, indikator power berkedip 3 kali lalu mati.',
      preferredSchedule: '2026-09-04 Sore',
      status: 'DIAGNOSING',
      estimatedCost: 450000,
      finalCost: 450000,
      notes: 'Sedang cek jalur tegangan 3.3V dan short kapasitor pada rail utama.',
      invoice: {
        create: {
          invoiceNumber: 'INV-2026-0004',
          subtotal: 450000,
          discount: 0,
          total: 450000,
          paymentStatus: 'UNPAID',
        },
      },
    },
  });

  const order5 = await prisma.serviceOrder.create({
    data: {
      orderNumber: 'SRV-2026-0005',
      customerId: customerHendra.id,
      serviceId: services[3].id, // Data Recovery
      technicianId: technicians[2].id,
      deviceType: 'Eksternal Storage',
      deviceBrand: 'Western Digital',
      deviceModel: 'My Passport 2TB',
      problemDescription: 'Harddisk berbunyi klik-klik dan partisi terbaca RAW di Windows Explorer.',
      preferredSchedule: '2026-09-02 Pagi',
      status: 'READY',
      estimatedCost: 500000,
      finalCost: 500000,
      notes: 'Recovery 185GB file dokumen penting sukses diselamatkan. Unit dan media backup siap diambil di workshop.',
      invoice: {
        create: {
          invoiceNumber: 'INV-2026-0005',
          subtotal: 500000,
          discount: 0,
          total: 500000,
          paymentStatus: 'UNPAID',
        },
      },
    },
  });

  console.log(`✅ Seeded 5 Sample Orders across stages: REQUESTED, DIAGNOSING, IN_PROGRESS, READY, COMPLETED`);
  console.log('🎉 Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
