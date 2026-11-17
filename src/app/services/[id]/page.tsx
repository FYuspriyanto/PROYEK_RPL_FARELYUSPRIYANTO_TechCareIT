import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import {
  Cpu,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Wrench,
  ChevronLeft,
  DollarSign,
  Laptop,
  Check,
  HelpCircle,
  Sparkles,
  Bot,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  const service = await prisma.service.findUnique({
    where: { id },
  });

  if (!service) {
    notFound();
  }

  // Related other services
  const otherServices = await prisma.service.findMany({
    where: { id: { not: id }, isActive: true },
    take: 3,
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
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
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontWeight: 800,
              fontSize: '1.3rem',
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
              }}
            >
              <Cpu size={22} />
            </div>
            <span>
              Tech<span className="text-gradient">Care</span>
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/services" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Katalog Layanan
            </Link>
            {session ? (
              <Link href="/customer/dashboard" className="btn btn-primary btn-sm">
                Dashboard Saya
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary btn-sm">
                Masuk / Daftar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '3rem 0 5rem 0', flex: 1 }}>
        <div className="container">
          {/* Breadcrumb Back Link */}
          <Link
            href="/services"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--accent-cyan)',
              fontSize: '0.9rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
            }}
          >
            <ChevronLeft size={16} />
            <span>Kembali ke Katalog Layanan</span>
          </Link>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.8fr 1.2fr',
              gap: '2.5rem',
              alignItems: 'flex-start',
            }}
            className="grid-detail"
          >
            {/* Left Column: Service Details */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span className="badge badge-indigo">{service.category}</span>
                <span className="badge badge-emerald">Bergaransi 90 Hari</span>
              </div>

              <h1 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '1.25rem' }}>
                {service.name}
              </h1>

              <div
                className="glass-card"
                style={{
                  padding: '1.75rem',
                  marginBottom: '2rem',
                }}
              >
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  Deskripsi Lengkap Layanan
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
                  {service.description}
                </p>
              </div>

              {/* What is Included */}
              <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                  Cakupan & Standar Pengerjaan:
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: 'var(--accent-emerald)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <Check size={14} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.925rem' }}>Pemeriksaan & Diagnosa Awal Komprehensif</strong>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Pengecekan tegangan rail, thermal sensor, dan stabilitas modul hardware.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: 'var(--accent-emerald)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <Check size={14} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.925rem' }}>Peralatan Laboratorium & Komponen Original</strong>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Menggunakan thermal paste kelas antusias (Artic MX-4/Kryonaut) atau IC grade A+.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: 'var(--accent-emerald)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <Check size={14} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.925rem' }}>Stress Test & Uji Beban Sebelum Diserahkan</strong>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Benchmark 100% load CPU/GPU minimal 30 menit memastikan kestabilan suhu & sistem.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: 'var(--accent-emerald)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <Check size={14} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.925rem' }}>Garansi Pengerjaan Resmi</strong>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Klaim mudah dengan riwayat digital yang tersimpan pada akun portal Anda.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Order Booking Card */}
            <div style={{ position: 'sticky', top: '90px' }}>
              <div
                className="glass-card"
                style={{
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  boxShadow: '0 0 30px rgba(56, 189, 248, 0.12)',
                  padding: '2rem',
                }}
              >
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Estimasi Biaya Mulai:</div>
                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: 'var(--accent-cyan)',
                    marginBottom: '1rem',
                  }}
                >
                  Rp {service.priceFrom.toLocaleString('id-ID')}
                </div>

                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    fontSize: '0.875rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Estimasi Waktu:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{service.estimatedDuration}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Masa Garansi:</span>
                    <strong style={{ color: 'var(--accent-emerald)' }}>90 Hari</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status Layanan:</span>
                    <strong style={{ color: 'var(--accent-cyan)' }}>Tersedia</strong>
                  </div>
                </div>

                <Link
                  href={`/customer/request?serviceId=${service.id}`}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    fontSize: '1rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <Wrench size={18} />
                  <span>Pesan Layanan Ini Sekarang</span>
                </Link>

                <Link
                  href="/customer/ai"
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
                >
                  <Bot size={16} color="var(--accent-cyan)" />
                  <span>Konsultasi AI Gratis</span>
                </Link>

                <p
                  style={{
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginTop: '1.25rem',
                  }}
                >
                  * Biaya akhir akan dikonfirmasi teknisi setelah proses diagnosa awal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
