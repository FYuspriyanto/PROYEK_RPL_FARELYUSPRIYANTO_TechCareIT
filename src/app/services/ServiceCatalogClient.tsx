'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search,
  CheckCircle2,
  Wrench,
  Bot,
  Filter,
  Sparkles,
  Layers,
} from 'lucide-react';

interface ServiceCatalogClientProps {
  services: any[];
  isLoggedIn: boolean;
}

export default function ServiceCatalogClient({
  services,
  isLoggedIn,
}: ServiceCatalogClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', ...Array.from(new Set(services.map((s) => s.category)))];

  const filteredServices = services.filter((srv) => {
    const matchesCategory =
      selectedCategory === 'ALL' || srv.category === selectedCategory;
    const matchesSearch =
      srv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
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
            <Link
              href="/customer/ai"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--accent-cyan)',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              <Bot size={16} />
              <span>Tanya AI</span>
            </Link>

            {isLoggedIn ? (
              <Link href="/customer/dashboard" className="btn btn-primary btn-sm">
                Dashboard Saya <ArrowRight size={15} />
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary btn-sm">
                Masuk / Daftar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section style={{ padding: '3.5rem 0 2.5rem 0', background: 'rgba(17, 23, 38, 0.4)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
          <span className="badge badge-cyan" style={{ marginBottom: '0.75rem' }}>
            Katalog Layanan Resmi
          </span>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Pilihan Solusi & Servis Komputer IT
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Temukan layanan perbaikan hardware, optimasi sistem, upgrade memori, dan recovery data
            dengan garansi serta estimasi biaya yang transparan.
          </p>
        </div>
      </section>

      {/* Main Catalog Content */}
      <section style={{ padding: '2.5rem 0 5rem 0', flex: 1 }}>
        <div className="container">
          {/* Filter and Search Bar */}
          <div
            className="glass-card"
            style={{
              padding: '1.25rem 1.5rem',
              marginBottom: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Cari layanan (misal: motherboard, thermal paste, instalasi os, ssd)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>

            {/* Category Chips */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
                Kategori:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`btn btn-sm ${
                    selectedCategory === cat ? 'btn-primary' : 'btn-secondary'
                  }`}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
                >
                  {cat === 'ALL' ? 'Semua Kategori' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Service Cards Grid */}
          {filteredServices.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem' }}>
              <Search size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Layanan Tidak Ditemukan
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Tidak ada layanan yang sesuai dengan kata kunci &ldquo;{searchTerm}&rdquo;. Coba ganti kata kunci
                atau pilih kategori lain.
              </p>
            </div>
          ) : (
            <div className="grid-3">
              {filteredServices.map((srv) => (
                <div
                  key={srv.id}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
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

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                      {srv.name}
                    </h3>

                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        marginBottom: '1.5rem',
                      }}
                    >
                      {srv.description}
                    </p>
                  </div>

                  <div
                    style={{
                      paddingTop: '1.25rem',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginBottom: '1rem',
                      }}
                    >
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Estimasi Biaya Mulai
                      </span>
                      <strong
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 800,
                          color: 'var(--accent-cyan)',
                        }}
                      >
                        Rp {srv.priceFrom.toLocaleString('id-ID')}
                      </strong>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.65rem' }}>
                      <Link
                        href={`/services/${srv.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%' }}
                      >
                        Lihat Detail
                      </Link>

                      <Link
                        href={`/customer/request?serviceId=${srv.id}`}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%' }}
                      >
                        <Wrench size={14} />
                        <span>Pesan Service</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border-subtle)',
          padding: '2.5rem 0',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={18} color="var(--accent-cyan)" />
            <span>&copy; {new Date().getFullYear()} TechCare Platform.</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="/">Halaman Utama</Link>
            <Link href="/customer/ai">AI Diagnostic</Link>
            <Link href="/login">Portal Akun</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
