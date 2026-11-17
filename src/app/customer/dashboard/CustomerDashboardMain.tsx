'use client';

import Link from 'next/link';
import {
  Activity,
  CreditCard,
  CheckCircle2,
  Layers,
  PlusCircle,
  Wrench,
  Bot,
  ArrowRight,
  Clock,
  Laptop,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  FileText,
  User,
} from 'lucide-react';
import OrderStatusTimeline from '@/components/OrderStatusTimeline';

interface CustomerDashboardMainProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string | null;
    address: string | null;
  };
  metrics: {
    activeServices: number;
    pendingPayment: number;
    completedServices: number;
    totalServices: number;
  };
  recentOrders: any[];
  recommendedServices: any[];
}

export default function CustomerDashboardMain({
  user,
  metrics,
  recentOrders,
  recommendedServices,
}: CustomerDashboardMainProps) {
  // Find primary active order for tracking highlight
  const primaryActiveOrder = recentOrders.find((o) =>
    ['REQUESTED', 'DIAGNOSING', 'WAITING_APPROVAL', 'IN_PROGRESS', 'READY'].includes(o.status)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return <span className="badge badge-amber">Permintaan Diterima</span>;
      case 'DIAGNOSING':
        return <span className="badge badge-indigo">Sedang Didiagnosa</span>;
      case 'WAITING_APPROVAL':
        return <span className="badge badge-amber">Menunggu Persetujuan</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-cyan">Dalam Pengerjaan</span>;
      case 'READY':
        return <span className="badge badge-emerald">Siap Diambil</span>;
      case 'COMPLETED':
        return <span className="badge badge-emerald">Selesai</span>;
      case 'CANCELLED':
        return <span className="badge badge-rose">Dibatalkan</span>;
      default:
        return <span className="badge badge-cyan">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div
        className="glass-card"
        style={{
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          background: 'linear-gradient(135deg, rgba(17, 23, 38, 0.9), rgba(23, 33, 56, 0.9))',
          border: '1px solid rgba(56, 189, 248, 0.25)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-emerald">Customer Terverifikasi</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Selamat datang kembali
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Halo, <span className="text-gradient">{user.name}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Pantau status pengerjaan perangkat, faktur pembayaran, dan ajukan servis dengan mudah.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/customer/ai" className="btn btn-secondary">
            <Bot size={17} color="var(--accent-cyan)" />
            <span>Tanya AI Diagnostic</span>
          </Link>

          <Link href="/customer/request" className="btn btn-primary">
            <PlusCircle size={17} />
            <span>Ajukan Servis Baru</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid-4">
        {/* Metric 1: Active Services */}
        <div className="glass-card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Active Services
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Activity size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
            {metrics.activeServices}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Sedang diproses teknisi
          </div>
        </div>

        {/* Metric 2: Pending Payment */}
        <div className="glass-card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Pending Payment
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--accent-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CreditCard size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f59e0b' }}>
            {metrics.pendingPayment}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Faktur belum diselesaikan
          </div>
        </div>

        {/* Metric 3: Completed Services */}
        <div className="glass-card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Completed Services
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#34d399' }}>
            {metrics.completedServices}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Servis sukses & bergaransi
          </div>
        </div>

        {/* Metric 4: Total Services */}
        <div className="glass-card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Total Services
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-indigo)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff' }}>
            {metrics.totalServices}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Seluruh riwayat pengerjaan
          </div>
        </div>
      </div>

      {/* Primary Active Order Tracker Snippet */}
      {primaryActiveOrder && (
        <div
          className="glass-card"
          style={{
            border: '1px solid rgba(56, 189, 248, 0.35)',
            boxShadow: '0 0 25px rgba(56, 189, 248, 0.1)',
            padding: '1.75rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span className="badge badge-cyan">Pesanan Aktif Berjalan</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>
                  {primaryActiveOrder.orderNumber}
                </strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {primaryActiveOrder.deviceBrand} {primaryActiveOrder.deviceModel} ({primaryActiveOrder.deviceType})
                &bull; {primaryActiveOrder.service?.name}
              </div>
            </div>

            <Link
              href={`/customer/orders/${primaryActiveOrder.id}`}
              className="btn btn-outline btn-sm"
            >
              <span>Lihat Detail Lengkap & Timeline</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Visual Timeline Component */}
          <OrderStatusTimeline currentStatus={primaryActiveOrder.status} />
        </div>
      )}

      {/* Recent Orders List */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Pesanan Servis Terbaru</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Daftar perangkat yang sedang diperiksa atau telah selesai diperbaiki
            </p>
          </div>

          <Link href="/customer/orders" className="btn btn-secondary btn-sm">
            <span>Lihat Semua Pesanan ({recentOrders.length})</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <Laptop size={44} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Belum Ada Servis yang Diajukan
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
              Laptop lemot, mati total, atau butuh deep cleaning? Buat permintaan servis pertama Anda sekarang.
            </p>
            <Link href="/customer/request" className="btn btn-primary btn-sm">
              <PlusCircle size={16} />
              <span>Ajukan Servis Baru</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentOrders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                className="glass-card"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>
                      {order.orderNumber}
                    </strong>
                    {getStatusBadge(order.status)}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
                    {order.deviceBrand} {order.deviceModel} &bull; <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{order.service?.name}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Diajukan: {new Date(order.createdAt).toLocaleDateString('id-ID')} &bull; Estimasi: Rp {(order.finalCost || order.estimatedCost || 0).toLocaleString('id-ID')}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Link
                    href={`/customer/orders/${order.id}`}
                    className="btn btn-secondary btn-sm"
                  >
                    <span>Lacak & Rincian</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Services Section */}
      <div>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Layanan Pemeliharaan Populer</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Tingkatkan performa dan cegah kerusakan hardware perangkat Anda
          </p>
        </div>

        <div className="grid-3">
          {recommendedServices.map((srv) => (
            <div key={srv.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span className="badge badge-indigo" style={{ marginBottom: '0.65rem' }}>{srv.category}</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>{srv.name}</h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                  {srv.description}
                </p>
              </div>

              <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>
                  Rp {srv.priceFrom.toLocaleString('id-ID')}
                </span>

                <Link href={`/customer/request?serviceId=${srv.id}`} className="btn btn-primary btn-sm">
                  Pesan
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
