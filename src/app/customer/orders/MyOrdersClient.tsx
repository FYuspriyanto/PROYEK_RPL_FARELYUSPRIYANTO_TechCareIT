'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Search,
  Filter,
  ArrowRight,
  Clock,
  Laptop,
  PlusCircle,
  Wrench,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface MyOrdersClientProps {
  initialOrders: any[];
}

export default function MyOrdersClient({ initialOrders }: MyOrdersClientProps) {
  const [orders] = useState<any[]>(initialOrders);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const statusOptions = [
    { label: 'Semua Status', value: 'ALL' },
    { label: '1. Permintaan (REQUESTED)', value: 'REQUESTED' },
    { label: '2. Diagnosa (DIAGNOSING)', value: 'DIAGNOSING' },
    { label: '3. Menunggu Persetujuan', value: 'WAITING_APPROVAL' },
    { label: '4. Pengerjaan (IN_PROGRESS)', value: 'IN_PROGRESS' },
    { label: '5. Siap Diambil (READY)', value: 'READY' },
    { label: '6. Selesai (COMPLETED)', value: 'COMPLETED' },
  ];

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.deviceBrand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.deviceModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.service?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return <span className="badge badge-amber">1. REQUESTED</span>;
      case 'DIAGNOSING':
        return <span className="badge badge-indigo">2. DIAGNOSING</span>;
      case 'WAITING_APPROVAL':
        return <span className="badge badge-amber">3. WAITING APPROVAL</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-cyan">4. IN PROGRESS</span>;
      case 'READY':
        return <span className="badge badge-emerald">5. READY FOR PICKUP</span>;
      case 'COMPLETED':
        return <span className="badge badge-emerald">6. COMPLETED</span>;
      case 'CANCELLED':
        return <span className="badge badge-rose">CANCELLED</span>;
      default:
        return <span className="badge badge-cyan">{status}</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Pesanan Servis Saya (My Orders)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Pantau status pengerjaan, estimasi biaya, dan riwayat garansi perangkat Anda
          </p>
        </div>

        <Link href="/customer/request" className="btn btn-primary">
          <PlusCircle size={16} />
          <span>Ajukan Servis Baru</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-card"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative' }}>
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
            placeholder="Cari berdasarkan No. Tiket, Merk Laptop, Seri, atau Layanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status Filter:</span>
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`btn btn-sm ${statusFilter === opt.value ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Package size={44} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Tidak Ada Pesanan Ditemukan
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            {searchQuery || statusFilter !== 'ALL'
              ? 'Tidak ada pesanan yang cocok dengan kriteria filter pencarian Anda.'
              : 'Anda belum memiliki riwayat pesanan servis. Klik tombol di bawah untuk mengajukan perbaikan.'}
          </p>

          <Link href="/customer/request" className="btn btn-primary btn-sm">
            <PlusCircle size={16} />
            <span>Ajukan Servis Baru</span>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="glass-card"
              style={{
                padding: '1.75rem',
                border: '1px solid var(--border-subtle)',
                transition: 'border-color var(--transition-normal)',
              }}
            >
              {/* Top Header of Card */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>
                      {order.orderNumber}
                    </strong>
                    {getStatusBadge(order.status)}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Diajukan pada: {new Date(order.createdAt).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                    Estimasi Biaya
                  </span>
                  <strong style={{ fontSize: '1.25rem', color: '#34d399' }}>
                    Rp {(order.finalCost || order.estimatedCost || 0).toLocaleString('id-ID')}
                  </strong>
                </div>
              </div>

              {/* Device and Problem Grid */}
              <div className="grid-3" style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block' }}>
                    Perangkat
                  </span>
                  <strong style={{ color: '#fff' }}>
                    {order.deviceBrand} {order.deviceModel} ({order.deviceType})
                  </strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block' }}>
                    Paket Layanan
                  </span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {order.service?.name || '-'}
                  </span>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block' }}>
                    Teknisi Penanggung Jawab
                  </span>
                  <span style={{ color: order.technician ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                    {order.technician ? order.technician.name : 'Sedang Ditentukan'}
                  </span>
                </div>
              </div>

              {/* Problem snippet */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '1rem',
                }}
              >
                <strong style={{ color: 'var(--text-secondary)' }}>Deskripsi Keluhan: </strong>
                <span>{order.problemDescription}</span>
              </div>

              {/* Actions & Detail Button */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {order.invoice && (
                    <span>
                      Faktur: <strong>{order.invoice.invoiceNumber}</strong> &bull;{' '}
                      <span style={{ color: order.invoice.paymentStatus === 'PAID' ? '#34d399' : '#f59e0b' }}>
                        {order.invoice.paymentStatus === 'PAID' ? 'Lunas' : 'Belum Dibayar'}
                      </span>
                    </span>
                  )}
                </div>

                <Link
                  href={`/customer/orders/${order.id}`}
                  className="btn btn-primary btn-sm"
                >
                  <span>Lacak Timeline & Rincian</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
