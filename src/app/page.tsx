import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import {
  Wrench,
  ShieldCheck,
  Cpu,
  Clock,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  FileText,
  Laptop,
  HelpCircle,
  Bot,
  Zap,
  Star,
  Layers,
  ChevronRight,
  PhoneCall,
  MapPin,
  Headphones,
  Check,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getSession();

  // Fetch active services
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    take: 6,
  });

  // Fetch technicians
  const technicians = await prisma.technician.findMany({
    where: { isActive: true },
    take: 3,
  });

  // Fetch KB articles
  const articles = await prisma.knowledgeBase.findMany({
    where: { isPublished: true },
    take: 4,
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(10, 13, 20, 0.85)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '72px',
          }}
        >
          {/* Brand */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontWeight: 800,
              fontSize: '1.3rem',
              letterSpacing: '-0.02em',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
              }}
            >
              <Cpu size={22} />
            </div>
            <span>
              Tech<span className="text-gradient">Care</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav
            style={{
              display: 'flex',
              gap: '1.75rem',
              alignItems: 'center',
              fontSize: '0.925rem',
              fontWeight: 500,
            }}
            className="header-nav"
          >
            <Link href="/services" style={{ color: 'var(--text-secondary)' }}>
              Katalog Layanan
            </Link>
            <a href="#how-it-works" style={{ color: 'var(--text-secondary)' }}>
              Cara Kerja
            </a>
            <a href="#why-us" style={{ color: 'var(--text-secondary)' }}>
              Keunggulan
            </a>
            <a href="#testimonials" style={{ color: 'var(--text-secondary)' }}>
              Testimoni
            </a>
            <Link
              href={session ? '/customer/ai' : '/login'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: 'var(--accent-cyan)',
                fontWeight: 600,
              }}
            >
              <Bot size={16} />
              <span>Tanya AI</span>
            </Link>
          </nav>

          {/* Auth CTA Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {session ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link
                  href={session.role === 'ADMIN' ? '/admin/dashboard' : '/customer/dashboard'}
                  className="btn btn-primary btn-sm"
                >
                  Buka Portal ({session.name.split(' ')[0]}) <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <>
                <Link href="/login" className="btn btn-secondary btn-sm">
                  Masuk
                </Link>
                <Link href="/register" className="btn btn-primary btn-sm">
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* SECTION 1: HERO */}
      <section style={{ padding: '5.5rem 0 4rem 0', position: 'relative', overflow: 'hidden' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '960px' }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1.15rem',
              borderRadius: '9999px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: 'var(--accent-cyan)',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1.75rem',
            }}
          >
            <Sparkles size={16} />
            <span>Pusat Solusi & Perbaikan Komputer, Laptop & IT Bergaransi</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5.5vw, 4rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              marginBottom: '1.5rem',
            }}
          >
            Servis Komputer & IT Cepat, Transparan, dan{' '}
            <span className="text-gradient">Didukung AI Diagnostic</span>
          </h1>

          <p
            style={{
              fontSize: '1.15rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: '2.5rem',
              maxWidth: '780px',
              margin: '0 auto 2.5rem auto',
            }}
          >
            Solusi perbaikan motherboard, penggantian IC, deep cleaning pendingin, optimasi OS,
            hingga pemulihan data (Data Recovery). Lacak status pengerjaan secara realtime dari
            perangkat Anda.
          </p>

          {/* Dual Primary CTAs: "Pesan Service" & "Tanya AI" */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
              marginBottom: '3.5rem',
            }}
          >
            <Link
              href={session ? '/customer/request' : '/services'}
              className="btn btn-primary"
              style={{
                padding: '0.95rem 2.2rem',
                fontSize: '1.05rem',
                boxShadow: '0 0 25px rgba(56, 189, 248, 0.35)',
              }}
            >
              <Wrench size={18} />
              <span>Pesan Service</span>
              <ArrowRight size={18} />
            </Link>

            <Link
              href={session ? '/customer/ai' : '/customer/ai'}
              className="btn btn-secondary"
              style={{
                padding: '0.95rem 2rem',
                fontSize: '1.05rem',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#c7d2fe',
              }}
            >
              <Bot size={18} color="var(--accent-cyan)" />
              <span>Tanya AI Diagnostic</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div
            className="grid-4"
            style={{
              background: 'rgba(17, 23, 38, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>1-3 Hari</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Pengerjaan Kilat
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--accent-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>Garansi 90 Hari</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Sparepart Original
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--accent-indigo)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>Live Tracking</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  6 Tahap Transparan
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: 'var(--accent-amber)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>AI Estimasi</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Cek Kerusakan 24/7
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: SERVICES SHOWCASE */}
      <section id="services" style={{ padding: '4.5rem 0', background: 'rgba(17, 23, 38, 0.35)' }}>
        <div className="container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '3rem',
            }}
          >
            <div>
              <span className="badge badge-cyan" style={{ marginBottom: '0.75rem' }}>
                Katalog Layanan
              </span>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Solusi Servis IT Profesional
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                Dikerjakan dengan standar laboratorium elektronik & alat diagnostik modern.
              </p>
            </div>

            <Link href="/services" className="btn btn-outline">
              <span>Lihat Semua Layanan ({services.length})</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid-3">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem',
                  }}
                >
                  <span className="badge badge-indigo">{srv.category}</span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Clock size={14} />
                    <span>{srv.estimatedDuration}</span>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  {srv.name}
                </h3>

                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    flex: 1,
                    marginBottom: '1.5rem',
                    lineHeight: 1.6,
                  }}
                >
                  {srv.description}
                </p>

                <div
                  style={{
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mulai dari</div>
                    <div
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        color: 'var(--accent-cyan)',
                      }}
                    >
                      Rp {srv.priceFrom.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link href={`/services/${srv.id}`} className="btn btn-secondary btn-sm">
                      Detail
                    </Link>
                    <Link
                      href={session ? `/customer/request?serviceId=${srv.id}` : `/services/${srv.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      Pesan
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: WHY CHOOSE US */}
      <section id="why-us" style={{ padding: '5rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3.5rem auto' }}>
            <span className="badge badge-emerald" style={{ marginBottom: '0.75rem' }}>
              Keunggulan Kami
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Mengapa Memilih TechCare?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Kami memadukan keahlian teknis mikrosolder kelas atas dengan sistem pelacakan digital transparan.
            </p>
          </div>

          <div className="grid-4">
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Cpu size={26} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Laboratorium Mikrosolder
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Peralatan diagnosa oscilloscope, thermal imager & stasiun solder BGA presisi tinggi
                untuk perbaikan level komponen.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--accent-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <ShieldCheck size={26} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Garansi Resmi Hingga 90 Hari
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Setiap penggantian komponen dan perbaikan motherboard dilindungi garansi bebas cemas
                dengan suku cadang original.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--accent-indigo)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <UserCheck size={26} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Privasi & Keamanan Data
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Data dokumen dan penyimpanan Anda diperlakukan dengan isolasi ketat tanpa akses tidak sah.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: 'var(--accent-amber)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Zap size={26} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Transparansi Biaya
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Biaya diestimasi di awal dengan persetujuan pelanggan sebelum pengerjaan dimulai. Bebas biaya tersembunyi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: HOW IT WORKS (4 STEPS) */}
      <section id="how-it-works" style={{ padding: '5rem 0', background: 'rgba(17, 23, 38, 0.35)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3.5rem auto' }}>
            <span className="badge badge-cyan" style={{ marginBottom: '0.75rem' }}>
              Proses Transparan
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Bagaimana Cara Kerjanya?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              4 langkah mudah mendapatkan layanan perbaikan perangkat komputer Anda.
            </p>
          </div>

          <div className="grid-4">
            <div className="glass-card" style={{ position: 'relative', padding: '1.75rem' }}>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: 'rgba(56, 189, 248, 0.25)',
                  marginBottom: '0.5rem',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                01
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Ajukan Service Online
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Isi form tipe perangkat, keluhan kerusakan, dan jadwal antar/jemput unit melalui portal.
              </p>
            </div>

            <div className="glass-card" style={{ position: 'relative', padding: '1.75rem' }}>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: 'rgba(99, 102, 241, 0.25)',
                  marginBottom: '0.5rem',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                02
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Diagnosa & Persetujuan
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Teknisi memeriksa detail kerusakan dan memberikan estimasi rincian biaya kepada Anda.
              </p>
            </div>

            <div className="glass-card" style={{ position: 'relative', padding: '1.75rem' }}>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: 'rgba(16, 185, 129, 0.25)',
                  marginBottom: '0.5rem',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                03
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Pengerjaan Profesional
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Perbaikan dilakukan dengan suku cadang teruji dan update catatan progres langsung di sistem.
              </p>
            </div>

            <div className="glass-card" style={{ position: 'relative', padding: '1.75rem' }}>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: 'rgba(245, 158, 11, 0.25)',
                  marginBottom: '0.5rem',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                04
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Uji Kualitas & Pengambilan
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Benchmark suhu/stabilitas, konfirmasi faktur, dan unit siap diambil dengan garansi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: TESTIMONIALS */}
      <section id="testimonials" style={{ padding: '5rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3.5rem auto' }}>
            <span className="badge badge-amber" style={{ marginBottom: '0.75rem' }}>
              Ulasan Pelanggan
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Apa Kata Mereka Tentang TechCare?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Kepuasan lebih dari 1.200+ pemilik laptop, PC workstation, dan perusahaan IT.
            </p>
          </div>

          <div className="grid-3">
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', gap: '0.25rem', color: '#f59e0b', marginBottom: '1rem' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="#f59e0b" />
                ))}
              </div>
              <p
                style={{
                  fontSize: '0.925rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.65,
                  marginBottom: '1.25rem',
                }}
              >
                &ldquo;Laptop ROG saya mati total akibat short VCore setelah ketumpahan kopi. Teknisi di
                TechCare berhasil ganti IC regulator dan membersihkan board sampai nyala normal lagi!&rdquo;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  BS
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Budi Santoso</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Asus ROG Strix G15 (Hardware Repair)
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', gap: '0.25rem', color: '#f59e0b', marginBottom: '1rem' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="#f59e0b" />
                ))}
              </div>
              <p
                style={{
                  fontSize: '0.925rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.65,
                  marginBottom: '1.25rem',
                }}
              >
                &ldquo;SSD eksternal kantor corrupt saat deadline skripsi dan desain. 185GB file berhasil
                diselamatkan tanpa ada yang rusak. Sangat profesional dan transparan pelacakannya.&rdquo;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981, #38bdf8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  SR
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Siti Rahma</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    MacBook Air & SSD Storage (Data Recovery)
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', gap: '0.25rem', color: '#f59e0b', marginBottom: '1rem' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="#f59e0b" />
                ))}
              </div>
              <p
                style={{
                  fontSize: '0.925rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.65,
                  marginBottom: '1.25rem',
                }}
              >
                &ldquo;Fitur Tanya AI Diagnostic sangat membantu diagnosa awal sebelum servis. Pengerjaan
                deep cleaning dan ganti thermal paste cepat cuma 1 hari, suhu turun drastis 20 derajat!&rdquo;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  HW
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Hendra Wijaya</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    PC Workstation & Laptop (Deep Cleaning)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: CTA BANNER */}
      <section style={{ padding: '4rem 0', position: 'relative' }}>
        <div className="container">
          <div
            className="glass-card"
            style={{
              background: 'linear-gradient(135deg, rgba(17, 23, 38, 0.95), rgba(23, 33, 56, 0.95))',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '3.5rem 2rem',
              textAlign: 'center',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 0 40px rgba(56, 189, 248, 0.15)',
            }}
          >
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, marginBottom: '1rem' }}>
              Siap Memperbaiki Perangkat Komputer Anda?
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                maxWidth: '650px',
                margin: '0 auto 2rem auto',
                fontSize: '1.05rem',
              }}
            >
              Konsultasikan kerusakan gratis melalui AI Assistant kami atau langsung buat pesanan
              perbaikan dengan estimasi biaya transparan.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link
                href={session ? '/customer/request' : '/services'}
                className="btn btn-primary"
                style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}
              >
                <Wrench size={18} />
                <span>Pesan Service Sekarang</span>
              </Link>

              <Link
                href="/customer/ai"
                className="btn btn-secondary"
                style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}
              >
                <Bot size={18} color="var(--accent-cyan)" />
                <span>Tanya AI Diagnostic</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: FOOTER */}
      <footer
        style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-secondary)',
          padding: '4rem 0 2rem 0',
        }}
      >
        <div className="container">
          <div className="grid-4" style={{ marginBottom: '3rem', gap: '2rem' }}>
            {/* Col 1 */}
            <div>
              <Link
                href="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <Cpu size={18} />
                </div>
                <span>
                  Tech<span className="text-gradient">Care</span>
                </span>
              </Link>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Platform layanan dan perbaikan hardware IT terdepan dengan diagnostik presisi, teknisi
                bersertifikat, dan transparansi status realtime.
              </p>
            </div>

            {/* Col 2 */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>
                Layanan Utama
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <li><Link href="/services">Perbaikan Motherboard & IC</Link></li>
                <li><Link href="/services">Deep Cleaning & Thermal Paste</Link></li>
                <li><Link href="/services">Data Recovery HDD / SSD</Link></li>
                <li><Link href="/services">Instalasi & Optimasi OS</Link></li>
                <li><Link href="/services">Upgrade SSD NVMe & RAM</Link></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>
                Portal & Bantuan
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <li><Link href="/customer/ai">AI Diagnostic Assistant</Link></li>
                <li><Link href="/customer/request">Ajukan Servis Baru</Link></li>
                <li><Link href="/customer/orders">Lacak Status Pesanan</Link></li>
                <li><Link href="/login">Portal Login Customer</Link></li>
                <li><Link href="/register">Registrasi Akun Baru</Link></li>
              </ul>
            </div>

            {/* Col 4 */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>
                Workshop & Kontak
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <MapPin size={16} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <span>Kawasan IT Hub, Jl. Sudirman No. 45, Jakarta Selatan</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PhoneCall size={16} color="var(--accent-emerald)" />
                  <span>0812-3456-7890 (WhatsApp Support)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} color="var(--accent-indigo)" />
                  <span>Senin - Sabtu (08:30 - 18:00 WIB)</span>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              fontSize: '0.825rem',
              color: 'var(--text-muted)',
            }}
          >
            <div>&copy; {new Date().getFullYear()} TechCare IT Solutions Platform. All rights reserved.</div>
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <span>Ketentuan Layanan</span>
              <span>Kebijakan Privasi Garansi</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
