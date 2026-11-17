'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  PackageCheck,
  Clock,
  ArrowRight,
  FileText,
  Wrench,
  Search,
  Laptop,
} from 'lucide-react';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || 'SRV-2026-XXXX';
  const orderId = searchParams.get('orderId');

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1rem 0' }}>
      <div
        className="glass-card"
        style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          boxShadow: '0 0 35px rgba(16, 185, 129, 0.15)',
        }}
      >
        {/* Success Icon */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid rgba(16, 185, 129, 0.4)',
            color: 'var(--accent-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
          }}
        >
          <CheckCircle2 size={40} />
        </div>

        <span className="badge badge-emerald" style={{ marginBottom: '0.75rem' }}>
          Permintaan Berhasil Dibuat
        </span>

        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Pengajuan Servis Diterima!
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
          Nomor tiket perbaikan Anda telah diterbitkan. Teknisi kami akan segera memverifikasi keluhan dan jadwal yang Anda ajukan.
        </p>

        {/* Order Number Box */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '2rem',
            display: 'inline-block',
            minWidth: '280px',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nomor Pesanan (Order Number):</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '0.05em' }}>
            {orderNumber}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem', fontWeight: 600 }}>
            STATUS AWAL: REQUESTED
          </div>
        </div>

        {/* Next Steps Box */}
        <div
          style={{
            textAlign: 'left',
            background: 'rgba(17, 23, 38, 0.6)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            marginBottom: '2.5rem',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#fff' }}>
            Langkah Selanjutnya:
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>1.</span>
              <span>Bawa atau tunggu konfirmasi penjemputan unit sesuai jadwal yang Anda pilih.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>2.</span>
              <span>Teknisi akan memulai proses <strong>DIAGNOSING</strong> di workshop kami.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>3.</span>
              <span>Pantau progres 6 tahap secara realtime di halaman <strong>My Orders</strong>.</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {orderId ? (
            <Link href={`/customer/orders/${orderId}`} className="btn btn-primary">
              <Search size={16} />
              <span>Lacak Status & Timeline Pesanan</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <Link href="/customer/orders" className="btn btn-primary">
              <PackageCheck size={16} />
              <span>Buka Menu Pesanan Saya</span>
              <ArrowRight size={16} />
            </Link>
          )}

          <Link href="/customer/dashboard" className="btn btn-secondary">
            Ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ServiceRequestSuccessPage() {
  return (
    <Suspense fallback={<div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>Memuat konfirmasi...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
