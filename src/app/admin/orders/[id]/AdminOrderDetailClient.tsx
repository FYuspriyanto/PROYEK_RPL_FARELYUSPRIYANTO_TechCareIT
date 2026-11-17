'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, User, Laptop, Wrench, FileText, DollarSign,
  Save, CheckCircle2, AlertCircle, Loader2, Sparkles,
} from 'lucide-react';
import OrderStatusTimeline from '@/components/OrderStatusTimeline';

const STATUS_FLOW = ['REQUESTED', 'DIAGNOSING', 'WAITING_APPROVAL', 'IN_PROGRESS', 'READY', 'COMPLETED'];

const STATUS_BADGE: Record<string, string> = {
  REQUESTED: 'badge-amber',
  DIAGNOSING: 'badge-indigo',
  WAITING_APPROVAL: 'badge-amber',
  IN_PROGRESS: 'badge-cyan',
  READY: 'badge-emerald',
  COMPLETED: 'badge-emerald',
  CANCELLED: 'badge-rose',
};

interface AdminOrderDetailClientProps {
  order: any;
  technicians: any[];
}

export default function AdminOrderDetailClient({ order, technicians }: AdminOrderDetailClientProps) {
  const router = useRouter();

  const [form, setForm] = useState({
    status: order.status,
    technicianId: order.technicianId || '',
    estimatedCost: order.estimatedCost?.toString() || '',
    finalCost: order.finalCost?.toString() || '',
    notes: order.notes || '',
    invoicePaymentStatus: order.invoice?.paymentStatus || 'UNPAID',
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: form.status,
          technicianId: form.technicianId || null,
          estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : null,
          finalCost: form.finalCost ? parseFloat(form.finalCost) : null,
          notes: form.notes || null,
          invoicePaymentStatus: form.invoicePaymentStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal menyimpan perubahan');
      } else {
        setSuccess('Perubahan berhasil disimpan!');
        setTimeout(() => { router.refresh(); }, 1500);
      }
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Back */}
      <Link href="/admin/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.5rem' }}>
        <ChevronLeft size={16} /> Kembali ke Daftar Order
      </Link>

      {/* Header */}
      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem', border: '1px solid rgba(56,189,248,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <strong style={{ fontSize: '1.4rem', color: 'var(--accent-cyan)' }}>{order.orderNumber}</strong>
              <span className={`badge ${STATUS_BADGE[order.status] || 'badge-cyan'}`}>{order.status}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Dibuat: {new Date(order.createdAt).toLocaleString('id-ID')} · Diperbarui: {new Date(order.updatedAt).toLocaleString('id-ID')}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Biaya</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>
              Rp {(order.finalCost || order.estimatedCost || 0).toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* 6-stage timeline */}
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={14} color="var(--accent-cyan)" /> Status Timeline Pengerjaan
          </div>
          <OrderStatusTimeline currentStatus={order.status} />
        </div>
      </div>

      <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Customer Info */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={16} color="var(--accent-cyan)" /> Informasi Customer
          </h3>
          <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              { label: 'Nama', value: order.customer?.name },
              { label: 'Email', value: order.customer?.email },
              { label: 'Telepon', value: order.customer?.phone || '-' },
              { label: 'Alamat', value: order.customer?.profile?.address || '-' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <strong style={{ color: '#fff' }}>{value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Device Info */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Laptop size={16} color="var(--accent-cyan)" /> Informasi Perangkat
          </h3>
          <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              { label: 'Jenis', value: order.deviceType },
              { label: 'Merk', value: order.deviceBrand },
              { label: 'Model', value: order.deviceModel },
              { label: 'Layanan', value: order.service?.name },
              { label: 'Jadwal Pilihan', value: order.preferredSchedule || '-' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <strong style={{ color: '#fff' }}>{value}</strong>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '0.85rem', background: 'rgba(15,23,42,0.6)', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Deskripsi Keluhan:</strong>
            {order.problemDescription}
          </div>
        </div>
      </div>

      {/* Admin Edit Panel */}
      <div className="glass-card" style={{ padding: '2rem', border: '1px solid rgba(99,102,241,0.3)' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wrench size={18} color="var(--accent-indigo)" /> Panel Manajemen Admin
        </h3>

        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#34d399' }}>
            <CheckCircle2 size={16} /> {success}
          </div>
        )}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#f87171' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
          {/* Status */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Ubah Status Pesanan</label>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="form-input">
              {STATUS_FLOW.map((s) => <option key={s} value={s}>{s}</option>)}
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Assign Technician */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tugaskan Teknisi</label>
            <select value={form.technicianId} onChange={(e) => setForm((p) => ({ ...p, technicianId: e.target.value }))} className="form-input">
              <option value="">-- Belum Ditugaskan --</option>
              {technicians.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name} ({t.specialization})</option>
              ))}
            </select>
          </div>

          {/* Estimated Cost */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Estimasi Biaya (Rp)</label>
            <input type="number" value={form.estimatedCost} onChange={(e) => setForm((p) => ({ ...p, estimatedCost: e.target.value }))} className="form-input" placeholder="Contoh: 350000" min={0} />
          </div>

          {/* Final Cost */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Biaya Final (Rp)</label>
            <input type="number" value={form.finalCost} onChange={(e) => setForm((p) => ({ ...p, finalCost: e.target.value }))} className="form-input" placeholder="Biaya setelah pengerjaan selesai" min={0} />
          </div>

          {/* Invoice Payment Status */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Status Pembayaran Invoice</label>
            <select value={form.invoicePaymentStatus} onChange={(e) => setForm((p) => ({ ...p, invoicePaymentStatus: e.target.value }))} className="form-input">
              <option value="UNPAID">UNPAID — Belum Dibayar</option>
              <option value="PAID">PAID — Sudah Lunas</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Catatan Teknisi / Admin</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            className="form-input"
            rows={4}
            placeholder="Hasil diagnosa, komponen yang diganti, catatan pengerjaan, dll..."
            style={{ resize: 'vertical' }}
          />
        </div>

        <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ width: '100%' }}>
          {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</> : <><Save size={16} /> Simpan Semua Perubahan</>}
        </button>
      </div>

      {/* Invoice Summary */}
      {order.invoice && (
        <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={16} color="var(--accent-cyan)" /> Detail Invoice — {order.invoice.invoiceNumber}
          </h3>
          <div className="grid-3" style={{ fontSize: '0.875rem' }}>
            {[
              { label: 'Subtotal', value: `Rp ${order.invoice.subtotal.toLocaleString('id-ID')}` },
              { label: 'Diskon', value: `Rp ${(order.invoice.discount || 0).toLocaleString('id-ID')}` },
              { label: 'Total', value: `Rp ${order.invoice.total.toLocaleString('id-ID')}` },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{label}</div>
                <div style={{ fontWeight: 700, color: label === 'Total' ? '#34d399' : '#fff' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
