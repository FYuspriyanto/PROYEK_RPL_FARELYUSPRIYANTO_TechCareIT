'use client';

import { useState } from 'react';
import {
  Settings, Plus, PenLine, ToggleLeft, ToggleRight,
  CheckCircle2, AlertCircle, Loader2, X, Search,
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  priceFrom: number;
  estimatedDuration: string;
  isActive: boolean;
  createdAt: string;
  _count?: { orders: number };
}

const EMPTY_FORM = {
  name: '',
  category: '',
  description: '',
  priceFrom: '',
  estimatedDuration: '',
};

const CATEGORIES = ['Laptop Repair', 'PC Desktop', 'Network & WiFi', 'Data Recovery', 'Software & OS', 'Printer', 'Upgrade & Optimasi', 'Lainnya'];

export default function AdminServicesClient({ services: initial }: { services: Service[] }) {
  const [services, setServices] = useState<Service[]>(initial);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filtered = services.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
  });

  const openCreate = () => { setEditTarget(null); setForm(EMPTY_FORM); setFeedback(null); setShowModal(true); };
  const openEdit = (s: Service) => {
    setEditTarget(s);
    setForm({ name: s.name, category: s.category, description: s.description, priceFrom: s.priceFrom.toString(), estimatedDuration: s.estimatedDuration });
    setFeedback(null);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setFeedback(null); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.category || !form.description.trim() || !form.priceFrom || !form.estimatedDuration.trim()) {
      setFeedback({ type: 'err', msg: 'Semua field wajib diisi' });
      return;
    }
    if (isNaN(parseFloat(form.priceFrom)) || parseFloat(form.priceFrom) < 0) {
      setFeedback({ type: 'err', msg: 'Harga mulai harus berupa angka positif' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const payload = { ...form, priceFrom: parseFloat(form.priceFrom) };

    try {
      let res: Response;
      if (editTarget) {
        res = await fetch(`/api/admin/services/${editTarget.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', msg: data.error || 'Gagal menyimpan' });
      } else {
        setFeedback({ type: 'ok', msg: editTarget ? 'Layanan berhasil diperbarui!' : 'Layanan berhasil ditambahkan!' });
        const updated = data.data?.service;
        if (updated) {
          setServices((prev) =>
            editTarget
              ? prev.map((s) => (s.id === editTarget.id ? { ...s, ...updated } : s))
              : [{ ...updated, _count: { orders: 0 } }, ...prev]
          );
        }
        setTimeout(closeModal, 1200);
      }
    } catch {
      setFeedback({ type: 'err', msg: 'Terjadi kesalahan jaringan' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (svc: Service) => {
    setTogglingId(svc.id);
    try {
      const res = await fetch(`/api/admin/services/${svc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !svc.isActive }),
      });
      if (res.ok) {
        setServices((prev) => prev.map((s) => (s.id === svc.id ? { ...s, isActive: !s.isActive } : s)));
      }
    } catch {}
    setTogglingId(null);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Service Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {services.filter((s) => s.isActive).length} layanan aktif dari {services.length} total
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus size={16} /> Tambah Layanan
        </button>
      </div>

      {/* Search */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.75rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text" placeholder="Cari nama layanan atau kategori..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="form-input" style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nama Layanan</th>
              <th>Kategori</th>
              <th>Deskripsi</th>
              <th>Harga Mulai</th>
              <th>Est. Durasi</th>
              <th>Total Order</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Tidak ada layanan ditemukan</td>
              </tr>
            ) : (
              filtered.map((svc) => (
                <tr key={svc.id}>
                  <td>
                    <strong style={{ fontSize: '0.875rem', color: svc.isActive ? '#fff' : 'var(--text-muted)' }}>
                      {svc.name}
                    </strong>
                  </td>
                  <td>
                    <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>{svc.category}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '200px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {svc.description}
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: '#34d399', fontSize: '0.9rem' }}>
                      Rp {svc.priceFrom.toLocaleString('id-ID')}
                    </strong>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {svc.estimatedDuration}
                  </td>
                  <td>
                    <strong style={{ color: 'var(--accent-cyan)' }}>{svc._count?.orders ?? 0}</strong>
                  </td>
                  <td>
                    <span className={`badge ${svc.isActive ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: '0.7rem' }}>
                      {svc.isActive ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => openEdit(svc)} className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem' }}>
                        <PenLine size={13} /> Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(svc)}
                        disabled={togglingId === svc.id}
                        className="btn btn-sm"
                        style={{
                          fontSize: '0.75rem', border: '1px solid', background: 'transparent',
                          borderColor: svc.isActive ? 'rgba(244,63,94,0.4)' : 'rgba(16,185,129,0.4)',
                          color: svc.isActive ? '#f87171' : '#34d399',
                        }}
                      >
                        {togglingId === svc.id ? (
                          <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : svc.isActive ? (
                          <><ToggleRight size={13} /> Nonaktif</>
                        ) : (
                          <><ToggleLeft size={13} /> Aktifkan</>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="glass-card"
            style={{ width: '100%', maxWidth: '560px', margin: '1rem', padding: '2rem', border: '1px solid var(--border-accent)', boxShadow: '0 0 40px rgba(56,189,248,0.15)', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                {editTarget ? 'Edit Layanan' : 'Tambah Layanan Baru'}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {feedback && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: feedback.type === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.1)',
                border: `1px solid ${feedback.type === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
                borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
                marginBottom: '1rem', fontSize: '0.85rem',
                color: feedback.type === 'ok' ? '#34d399' : '#f87171',
              }}>
                {feedback.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                {feedback.msg}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Nama Layanan *</label>
              <input type="text" className="form-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Contoh: Perbaikan Laptop Tidak Menyala" />
            </div>
            <div className="form-group">
              <label className="form-label">Kategori *</label>
              <select className="form-input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                <option value="">-- Pilih Kategori --</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Deskripsi *</label>
              <textarea className="form-input" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Deskripsi singkat layanan..." style={{ resize: 'vertical' }} />
            </div>
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Harga Mulai (Rp) *</label>
                <input type="number" className="form-input" value={form.priceFrom} onChange={(e) => setForm((p) => ({ ...p, priceFrom: e.target.value }))} placeholder="Contoh: 150000" min={0} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Estimasi Durasi *</label>
                <input type="text" className="form-input" value={form.estimatedDuration} onChange={(e) => setForm((p) => ({ ...p, estimatedDuration: e.target.value }))} placeholder="Contoh: 1-3 hari kerja" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={closeModal} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
                {saving ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</> : <><Settings size={15} /> {editTarget ? 'Simpan Perubahan' : 'Tambah Layanan'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
