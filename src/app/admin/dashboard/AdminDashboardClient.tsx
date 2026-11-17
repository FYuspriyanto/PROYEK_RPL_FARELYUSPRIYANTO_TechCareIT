'use client';

import Link from 'next/link';
import {
  Users,
  Package,
  Wrench,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  TrendingUp,
  PackageCheck,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface AdminDashboardClientProps {
  metrics: {
    totalCustomers: number;
    newRequests: number;
    activeServices: number;
    readyForPickup: number;
    completedServices: number;
    totalRevenue: number;
    pendingPayments: number;
    pendingAmount: number;
  };
  recentOrders: any[];
  technicians: any[];
}

export default function AdminDashboardClient({ metrics, recentOrders, technicians }: AdminDashboardClientProps) {
  const kpiCards = [
    {
      label: 'Total Pelanggan',
      value: metrics.totalCustomers.toLocaleString('id-ID'),
      icon: Users,
      color: 'var(--accent-cyan)',
      bg: 'rgba(56,189,248,0.1)',
      border: 'rgba(56,189,248,0.25)',
      link: '/admin/customers',
    },
    {
      label: 'Permintaan Baru',
      value: metrics.newRequests.toLocaleString('id-ID'),
      icon: Package,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
      border: 'rgba(245,158,11,0.25)',
      link: '/admin/orders?status=REQUESTED',
    },
    {
      label: 'Sedang Dikerjakan',
      value: metrics.activeServices.toLocaleString('id-ID'),
      icon: Wrench,
      color: 'var(--accent-indigo)',
      bg: 'rgba(99,102,241,0.1)',
      border: 'rgba(99,102,241,0.25)',
      link: '/admin/orders?status=IN_PROGRESS',
    },
    {
      label: 'Siap Diambil',
      value: metrics.readyForPickup.toLocaleString('id-ID'),
      icon: PackageCheck,
      color: '#34d399',
      bg: 'rgba(52,211,153,0.1)',
      border: 'rgba(52,211,153,0.25)',
      link: '/admin/orders?status=READY',
    },
    {
      label: 'Selesai',
      value: metrics.completedServices.toLocaleString('id-ID'),
      icon: CheckCircle2,
      color: '#10b981',
      bg: 'rgba(16,185,129,0.1)',
      border: 'rgba(16,185,129,0.25)',
      link: '/admin/orders?status=COMPLETED',
    },
    {
      label: 'Total Pendapatan',
      value: `Rp ${(metrics.totalRevenue / 1_000_000).toFixed(1)}jt`,
      icon: TrendingUp,
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.1)',
      border: 'rgba(167,139,250,0.25)',
      link: '/admin/orders',
    },
    {
      label: 'Tagihan Belum Lunas',
      value: metrics.pendingPayments.toLocaleString('id-ID'),
      icon: AlertCircle,
      color: '#f43f5e',
      bg: 'rgba(244,63,94,0.1)',
      border: 'rgba(244,63,94,0.25)',
      link: '/admin/orders',
    },
    {
      label: 'Nilai Tagihan Pending',
      value: `Rp ${(metrics.pendingAmount / 1_000_000).toFixed(1)}jt`,
      icon: DollarSign,
      color: '#fbbf24',
      bg: 'rgba(251,191,36,0.1)',
      border: 'rgba(251,191,36,0.25)',
      link: '/admin/orders',
    },
  ];

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      REQUESTED: { label: 'REQUESTED', cls: 'badge-amber' },
      DIAGNOSING: { label: 'DIAGNOSING', cls: 'badge-indigo' },
      WAITING_APPROVAL: { label: 'WAITING', cls: 'badge-amber' },
      IN_PROGRESS: { label: 'IN PROGRESS', cls: 'badge-cyan' },
      READY: { label: 'READY', cls: 'badge-emerald' },
      COMPLETED: { label: 'COMPLETED', cls: 'badge-emerald' },
      CANCELLED: { label: 'CANCELLED', cls: 'badge-rose' },
    };
    const s = map[status] || { label: status, cls: 'badge-cyan' };
    return <span className={`badge ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Overview operasional layanan IT — realtime data dari database
        </p>
      </div>

      {/* KPI Grid — 4 columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '2rem',
        }}
        className="admin-kpi-grid"
      >
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link href={card.link} key={card.label} style={{ textDecoration: 'none' }}>
              <div
                className="glass-card"
                style={{
                  padding: '1.35rem',
                  background: card.bg,
                  border: `1px solid ${card.border}`,
                  cursor: 'pointer',
                  transition: 'transform var(--transition-normal)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 'var(--radius-md)',
                      background: card.bg,
                      border: `1px solid ${card.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: card.color,
                    }}
                  >
                    <Icon size={19} />
                  </div>
                  <ArrowRight size={14} color="var(--text-muted)" />
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: card.color, lineHeight: 1 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontWeight: 600 }}>
                  {card.label}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Two-column: Recent Orders + Technicians */}
      <div className="grid-2" style={{ gap: '1.5rem' }}>
        {/* Recent Orders Table */}
        <div className="glass-card" style={{ padding: '1.5rem', gridColumn: 'span 1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Pesanan Terbaru</h3>
            <Link href="/admin/orders" className="btn btn-outline btn-sm" style={{ fontSize: '0.775rem' }}>
              Lihat Semua <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentOrders.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Belum ada pesanan.</p>
            ) : (
              recentOrders.map((order: any) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      background: 'rgba(15,23,42,0.5)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'border-color var(--transition-fast)',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.15rem' }}>
                        {order.orderNumber}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.customer?.name} — {order.deviceBrand} {order.deviceModel}
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Technician Workload */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Beban Kerja Teknisi</h3>
            <Link href="/admin/technicians" className="btn btn-outline btn-sm" style={{ fontSize: '0.775rem' }}>
              Kelola <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {technicians.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Belum ada teknisi aktif.</p>
            ) : (
              technicians.map((tech: any) => {
                const load = tech._count?.assignedOrders ?? 0;
                const maxLoad = 5;
                const pct = Math.min((load / maxLoad) * 100, 100);
                return (
                  <div key={tech.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600 }}>{tech.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {load} order aktif
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: pct > 80
                            ? 'linear-gradient(90deg, #f43f5e, #f59e0b)'
                            : 'linear-gradient(90deg, var(--accent-cyan), var(--accent-indigo))',
                          borderRadius: '9999px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {tech.specialization}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1280px) { .admin-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 640px) { .admin-kpi-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
