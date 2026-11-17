'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  Search,
  Filter,
  ArrowRight,
  Package,
  Calendar,
  ChevronDown,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'REQUESTED', label: '1. REQUESTED' },
  { value: 'DIAGNOSING', label: '2. DIAGNOSING' },
  { value: 'WAITING_APPROVAL', label: '3. WAITING APPROVAL' },
  { value: 'IN_PROGRESS', label: '4. IN PROGRESS' },
  { value: 'READY', label: '5. READY' },
  { value: 'COMPLETED', label: '6. COMPLETED' },
  { value: 'CANCELLED', label: 'CANCELLED' },
];

const STATUS_BADGE: Record<string, string> = {
  REQUESTED: 'badge-amber',
  DIAGNOSING: 'badge-indigo',
  WAITING_APPROVAL: 'badge-amber',
  IN_PROGRESS: 'badge-cyan',
  READY: 'badge-emerald',
  COMPLETED: 'badge-emerald',
  CANCELLED: 'badge-rose',
};

function AdminOrdersInner({ initialOrders, technicians }: { initialOrders: any[]; technicians: any[] }) {
  const searchParams = useSearchParams();
  const defaultStatus = searchParams.get('status') || 'ALL';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(defaultStatus);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(() => {
    return initialOrders.filter((o) => {
      const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.deviceBrand.toLowerCase().includes(q) ||
        o.deviceModel.toLowerCase().includes(q) ||
        o.service?.name?.toLowerCase().includes(q);

      const created = new Date(o.createdAt);
      const matchFrom = !dateFrom || created >= new Date(dateFrom);
      const matchTo = !dateTo || created <= new Date(dateTo + 'T23:59:59');

      return matchStatus && matchSearch && matchFrom && matchTo;
    });
  }, [initialOrders, search, statusFilter, dateFrom, dateTo]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Service Order Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {filtered.length} dari {initialOrders.length} total pesanan
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '0.85rem', alignItems: 'end' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Cari no. order, customer, perangkat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.5rem', fontSize: '0.875rem' }}
            />
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input"
            style={{ fontSize: '0.875rem' }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Date From */}
          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Dari</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="form-input" style={{ fontSize: '0.85rem' }} />
          </div>

          {/* Date To */}
          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Sampai</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="form-input" style={{ fontSize: '0.85rem' }} />
          </div>
        </div>

        {/* Status quick-filter chips */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.85rem' }}>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              style={{
                padding: '0.25rem 0.7rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                background: statusFilter === s.value ? 'rgba(56,189,248,0.2)' : 'transparent',
                borderColor: statusFilter === s.value ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                color: statusFilter === s.value ? 'var(--accent-cyan)' : 'var(--text-muted)',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Package size={44} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontWeight: 600, marginBottom: '0.4rem' }}>Tidak Ada Pesanan Ditemukan</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Coba ubah filter atau kata kunci pencarian.</p>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>No. Order</th>
                <th>Customer</th>
                <th>Perangkat</th>
                <th>Layanan</th>
                <th>Teknisi</th>
                <th>Status</th>
                <th>Biaya</th>
                <th>Invoice</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.82rem' }}>
                      {order.orderNumber}
                    </strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{order.customer?.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{order.customer?.email}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>{order.deviceBrand} {order.deviceModel}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{order.deviceType}</div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{order.service?.name}</td>
                  <td style={{ fontSize: '0.85rem', color: order.technician ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                    {order.technician?.name || 'Belum ditugaskan'}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[order.status] || 'badge-cyan'}`} style={{ fontSize: '0.7rem' }}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34d399' }}>
                      Rp {(order.finalCost || order.estimatedCost || 0).toLocaleString('id-ID')}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${order.invoice?.paymentStatus === 'PAID' ? 'badge-emerald' : 'badge-amber'}`}
                      style={{ fontSize: '0.68rem' }}
                    >
                      {order.invoice?.paymentStatus || 'N/A'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td>
                    <Link href={`/admin/orders/${order.id}`} className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem' }}>
                      Detail <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersClient({ initialOrders, technicians }: { initialOrders: any[]; technicians: any[] }) {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Memuat data pesanan...</div>}>
      <AdminOrdersInner initialOrders={initialOrders} technicians={technicians} />
    </Suspense>
  );
}
