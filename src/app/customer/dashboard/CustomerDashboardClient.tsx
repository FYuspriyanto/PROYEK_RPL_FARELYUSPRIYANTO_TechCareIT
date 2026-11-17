'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Cpu,
  LogOut,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  MapPin,
  Phone,
  Mail,
  Wrench,
  DollarSign,
  ChevronRight,
  Laptop,
} from 'lucide-react';

interface CustomerDashboardClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string | null;
    address: string | null;
  };
  initialOrders: any[];
  services: any[];
}

export default function CustomerDashboardClient({
  user,
  initialOrders,
  services,
}: CustomerDashboardClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    serviceId: services[0]?.id || '',
    deviceType: 'Laptop',
    deviceBrand: '',
    deviceModel: '',
    problemDescription: '',
    notes: '',
  });

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Gagal mengajukan servis');
        setSubmitting(false);
        return;
      }

      setSuccessMsg('Servis berhasil diajukan! Teknisi akan segera menganalisa perangkat Anda.');
      setOrders((prev) => [data.data.order, ...prev]);
      setFormData({
        serviceId: services[0]?.id || '',
        deviceType: 'Laptop',
        deviceBrand: '',
        deviceModel: '',
        problemDescription: '',
        notes: '',
      });

      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge badge-amber">Menunggu Konfirmasi</span>;
      case 'DIAGNOSING':
        return <span className="badge badge-indigo">Sedang Didiagnosa</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-cyan">Dalam Pengerjaan</span>;
      case 'COMPLETED':
        return <span className="badge badge-emerald">Selesai / Siap Diambil</span>;
      case 'CANCELLED':
        return <span className="badge badge-rose">Dibatalkan</span>;
      default:
        return <span className="badge badge-cyan">{status}</span>;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Dashboard Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(10, 13, 20, 0.9)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '70px',
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
              fontSize: '1.25rem',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Cpu size={20} />
            </div>
            <span>
              Tech<span className="text-gradient">Care</span>
            </span>
          </Link>

          {/* User Info & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right', display: 'none' }} className="md-nav">
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>Customer Account</div>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn btn-secondary btn-sm"
              style={{ color: '#fb7185' }}
            >
              <LogOut size={16} />
              <span>{loggingOut ? 'Keluar...' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="container" style={{ padding: '2.5rem 1.5rem', flex: 1 }}>
        {/* Customer Welcome & Info Card */}
        <div
          className="glass-card"
          style={{
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
              <span className="badge badge-emerald">Akun Terverifikasi</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {user.id}</span>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
              Selamat Datang, <span className="text-gradient">{user.name}</span>
            </h1>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1.25rem',
                marginTop: '0.75rem',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={15} color="var(--accent-cyan)" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={15} color="var(--accent-emerald)" />
                  <span>{user.phone}</span>
                </div>
              )}
              {user.address && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={15} color="var(--accent-indigo)" />
                  <span>{user.address}</span>
                </div>
              )}
            </div>
          </div>

          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <PlusCircle size={18} />
            <span>Ajukan Servis Baru</span>
          </button>
        </div>

        {/* Orders Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Riwayat & Status Servis Saya</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Hanya menampilkan data pesanan dan faktur milik akun Anda
            </p>
          </div>
          <span className="badge badge-cyan">{orders.length} Pesanan Aktif</span>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div
            className="glass-card"
            style={{
              textAlign: 'center',
              padding: '3.5rem 1.5rem',
              color: 'var(--text-secondary)',
            }}
          >
            <Laptop size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Belum Ada Pesanan Servis
            </h3>
            <p style={{ fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
              Laptop atau komputer Anda bermasalah? Ajukan perbaikan sekarang untuk penanganan cepat oleh teknisi.
            </p>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm">
              <PlusCircle size={16} />
              <span>Buat Pesanan Pertama</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {orders.map((order) => (
              <div key={order.id} className="glass-card" style={{ padding: '1.5rem' }}>
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
                      <strong style={{ fontSize: '1.05rem', color: 'var(--accent-cyan)' }}>
                        {order.orderNumber}
                      </strong>
                      {getStatusBadge(order.status)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Dibuat pada: {new Date(order.createdAt).toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimasi Biaya</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>
                      Rp {(order.finalCost || order.estimatedCost || 0).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                {/* Device & Service Info */}
                <div className="grid-3" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>
                      Perangkat
                    </span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {order.deviceBrand} {order.deviceModel} ({order.deviceType})
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>
                      Kategori Layanan
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>{order.service?.name || '-'}</span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>
                      Teknisi Penanggung Jawab
                    </span>
                    <span style={{ color: order.technician ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                      {order.technician ? `${order.technician.name} (${order.technician.phone})` : 'Menunggu Penugasan'}
                    </span>
                  </div>
                </div>

                {/* Problem Description */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '0.75rem',
                  }}
                >
                  <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
                    Deskripsi Keluhan:
                  </strong>
                  {order.problemDescription}
                </div>

                {/* Progress / Notes if available */}
                {order.notes && (
                  <div
                    style={{
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      color: 'var(--accent-cyan)',
                    }}
                  >
                    <strong>Update Teknisi:</strong> {order.notes}
                  </div>
                )}

                {/* Invoice tag */}
                {order.invoice && (
                  <div
                    style={{
                      marginTop: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span>Faktur: <strong>{order.invoice.invoiceNumber}</strong></span>
                    <span>
                      Status Pembayaran:{' '}
                      <strong
                        style={{
                          color: order.invoice.paymentStatus === 'PAID' ? '#34d399' : '#f59e0b',
                        }}
                      >
                        {order.invoice.paymentStatus === 'PAID' ? 'LUNAS' : 'BELUM DIBAYAR'}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Ajukan Servis Baru */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 100,
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#111726',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '0.75rem',
              }}
            >
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Ajukan Servis IT Baru</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                }}
              >
                &times;
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#fb7185',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmitOrder}>
              <div className="form-group">
                <label className="form-label">Pilih Paket Layanan</label>
                <select
                  name="serviceId"
                  className="form-input"
                  value={formData.serviceId}
                  onChange={handleInputChange}
                  required
                >
                  {services.map((srv) => (
                    <option key={srv.id} value={srv.id} style={{ background: '#111726' }}>
                      {srv.name} - Rp {srv.priceFrom.toLocaleString('id-ID')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Jenis Perangkat</label>
                  <select
                    name="deviceType"
                    className="form-input"
                    value={formData.deviceType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Laptop" style={{ background: '#111726' }}>Laptop</option>
                    <option value="PC Desktop" style={{ background: '#111726' }}>PC Desktop / All-in-One</option>
                    <option value="MacBook" style={{ background: '#111726' }}>MacBook / iMac</option>
                    <option value="Server / Storage" style={{ background: '#111726' }}>Server / NAS Storage</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Merk (Brand)</label>
                  <input
                    name="deviceBrand"
                    type="text"
                    required
                    placeholder="Asus, Lenovo, Dell, Apple..."
                    className="form-input"
                    value={formData.deviceBrand}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Model / Seri Perangkat</label>
                <input
                  name="deviceModel"
                  type="text"
                  required
                  placeholder="Contoh: ROG Strix G15 / ThinkPad X1 Carbon"
                  className="form-input"
                  value={formData.deviceModel}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi Kerusakan / Gejala Kendala</label>
                <textarea
                  name="problemDescription"
                  rows={3}
                  required
                  minLength={10}
                  placeholder="Jelaskan secara detail gejala kerusakan (misal: sering mati mendadak saat render, tidak mau charging, layar bergaris)..."
                  className="form-input"
                  value={formData.problemDescription}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Catatan Tambahan (Opsional)</label>
                <input
                  name="notes"
                  type="text"
                  placeholder="Kelengkapan yang dibawa: Adaptor charger original + tas"
                  className="form-input"
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {submitting ? 'Mengirim Data...' : 'Kirim Permintaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
