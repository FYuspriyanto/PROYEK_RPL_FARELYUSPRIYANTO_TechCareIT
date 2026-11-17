'use client';

import { useState } from 'react';
import {
  Wrench, Plus, PenLine, ToggleLeft, ToggleRight,
  CheckCircle2, AlertCircle, Loader2, X, Search, Phone,
} from 'lucide-react';

interface Technician {
  id: string;
  name: string;
  phone: string;
  specialization: string;
  isActive: boolean;
  createdAt: string;
  _count?: { assignedOrders: number };
}

interface AdminTechniciansClientProps {
  technicians: Technician[];
}

const EMPTY_FORM = { name: '', phone: '', specialization: '' };

export default function AdminTechniciansClient({ technicians: initial }: AdminTechniciansClientProps) {
  const [technicians, setTechnicians] = useState<Technician[]>(initial);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Technician | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filtered = technicians.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.name.toLowerCase().includes(q) || t.specialization.toLowerCase().includes(q) || t.phone.includes(q);
  });

  const openCreate = () => { setEditTarget(null); setForm(EMPTY_FORM); setFeedback(null); setShowModal(true); };
  const openEdit = (t: Technician) => { setEditTarget(t); setForm({ name: t.name, phone: t.phone, specialization: t.specialization }); setFeedback(null); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setFeedback(null); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.specialization.trim()) {
      setFeedback({ type: 'err', msg: 'Semua field wajib diisi' });
      return;
    }
    setSaving(true);
    setFeedback(null);

    try {
      let res: Response;
      if (editTarget) {
        res = await fetch(`/api/admin/technicians/${editTarget.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch('/api/admin/technicians', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', msg: data.error || 'Gagal menyimpan' });
      } else {
        setFeedback({ type: 'ok', msg: editTarget ? 'Teknisi berhasil diperbarui!' : 'Teknisi berhasil ditambahkan!' });
        const updated = data.data?.technician;
        if (updated) {
          setTechnicians((prev) =>
            editTarget
              ? prev.map((t) => (t.id === editTarget.id ? { ...t, ...updated } : t))
              : [{ ...updated, _count: { assignedOrders: 0 } }, ...prev]
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

  const handleToggleActive = async (tech: Technician) => {
    setTogglingId(tech.id);
    try {
      const res = await fetch(`/api/admin/technicians/${tech.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !tech.isActive }),
      });
      const data = await res.json();
      if (res.ok) {
        setTechnicians((prev) =>
          prev.map((t) => (t.id === tech.id ? { ...t, isActive: !t.isActive } : t))
        );
      }
    } catch {}
    setTogglingId(null);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Technician Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {technicians.filter((t) => t.isActive).length} teknisi aktif dari {technicians.length} total
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus size={16} /> Tambah Teknisi
        </button>
      </div>

      {/* Search */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.75rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text" placeholder="Cari nama, spesialisasi, atau nomor telepon..."
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
              <th>Teknisi</th>
              <th>Telepon</th>
              <th>Spesialisasi</th>
              <th>Order Ditangani</th>
              <th>Status</th>
              <th>Bergabung</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Tidak ada teknisi ditemukan
                </td>
              </tr>
            ) : (
              filtered.map((tech) => (
                <tr key={tech.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: tech.isActive
                            ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))'
                            : 'rgba(100,116,139,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.85rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                        }}
                      >
                        {tech.name.charAt(0).toUpperCase()}
                      </div>
                      <strong style={{ fontSize: '0.875rem', color: tech.isActive ? '#fff' : 'var(--text-muted)' }}>
                        {tech.name}
                      </strong>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Phone size={13} color="var(--text-muted)" /> {tech.phone}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>{tech.specialization}</span>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--accent-cyan)' }}>{tech._count?.assignedOrders ?? 0}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}> total</span>
                  </td>
                  <td>
                    <span className={`badge ${tech.isActive ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: '0.72rem' }}>
                      {tech.isActive ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(tech.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => openEdit(tech)} className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem' }}>
                        <PenLine size={13} /> Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(tech)}
                        disabled={togglingId === tech.id}
                        className="btn btn-sm"
                        style={{
                          fontSize: '0.75rem', border: '1px solid',
                          borderColor: tech.isActive ? 'rgba(244,63,94,0.4)' : 'rgba(16,185,129,0.4)',
                          color: tech.isActive ? '#f87171' : '#34d399',
                          background: 'transparent',
                        }}
                      >
                        {togglingId === tech.id ? (
                          <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : tech.isActive ? (
                          <><ToggleRight size={13} /> Nonaktifkan</>
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

      {/* Modal — Create / Edit */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="glass-card"
            style={{ width: '100%', maxWidth: '480px', margin: '1rem', padding: '2rem', border: '1px solid var(--border-accent)', boxShadow: '0 0 40px rgba(56,189,248,0.15)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                {editTarget ? 'Edit Teknisi' : 'Tambah Teknisi Baru'}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {feedback && (
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: feedback.type === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.1)',
                  border: `1px solid ${feedback.type === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
                  borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
                  marginBottom: '1rem', fontSize: '0.85rem',
                  color: feedback.type === 'ok' ? '#34d399' : '#f87171',
                }}
              >
                {feedback.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                {feedback.msg}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Nama Lengkap *</label>
              <input type="text" className="form-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nama teknisi" />
            </div>
            <div className="form-group">
              <label className="form-label">Nomor Telepon / WhatsApp *</label>
              <input type="tel" className="form-input" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="08xxxxxxxxxx" />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Spesialisasi *</label>
              <input type="text" className="form-input" value={form.specialization} onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))} placeholder="Contoh: Laptop Repair, Data Recovery" />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={closeModal} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
                {saving ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</> : <><Wrench size={15} /> {editTarget ? 'Simpan Perubahan' : 'Tambah Teknisi'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
