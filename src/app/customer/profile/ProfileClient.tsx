'use client';

import { useState } from 'react';
import { User, Phone, MapPin, Mail, Save, CheckCircle2, AlertCircle, Loader2, Shield, Key } from 'lucide-react';

interface ProfileClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    role: string;
    createdAt: string;
  };
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    address: user.address || '',
  });
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState('');

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSavedOk(false);
    setError('');
  };

  const handleSaveProfile = async () => {
    if (!form.name.trim()) { setError('Nama lengkap wajib diisi'); return; }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, phone: form.phone, address: form.address }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal menyimpan profil');
      } else {
        setSavedOk(true);
        setTimeout(() => setSavedOk(false), 3000);
      }
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword) { setPwError('Password saat ini wajib diisi'); return; }
    if (pwForm.newPassword.length < 8) { setPwError('Password baru minimal 8 karakter'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('Konfirmasi password tidak cocok'); return; }

    setPwSaving(true);
    setPwError('');
    setPwSuccess(false);

    try {
      const res = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPwError(data.error || 'Gagal mengubah password');
      } else {
        setPwSuccess(true);
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch {
      setPwError('Terjadi kesalahan jaringan');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Profil Akun Saya</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Kelola informasi pribadi dan keamanan akun Anda
        </p>
      </div>

      {/* Avatar & Info Card */}
      <div
        className="glass-card"
        style={{
          padding: '1.75rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
          background: 'rgba(56, 189, 248, 0.04)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
        }}
      >
        {/* Avatar Circle */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-indigo) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.85rem',
            fontWeight: 800,
            color: '#fff',
            flexShrink: 0,
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>

        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{user.name}</h2>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{user.email}</div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span className="badge badge-cyan">{user.role}</span>
            <span className="badge badge-emerald">
              Bergabung sejak {new Date(user.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <User size={18} color="var(--accent-cyan)" />
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Informasi Pribadi</h3>
        </div>

        {/* Success / Error Banner */}
        {savedOk && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              color: '#34d399',
            }}
          >
            <CheckCircle2 size={17} />
            <span>Profil berhasil disimpan!</span>
          </div>
        )}

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              color: '#f87171',
            }}
          >
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid-2" style={{ gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">
              <User size={13} style={{ display: 'inline', marginRight: 4 }} />
              Nama Lengkap *
            </label>
            <input
              type="text"
              className="form-input"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nama lengkap Anda"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Mail size={13} style={{ display: 'inline', marginRight: 4 }} />
              Email (tidak dapat diubah)
            </label>
            <input
              type="email"
              className="form-input"
              value={user.email}
              readOnly
              style={{ opacity: 0.55, cursor: 'not-allowed' }}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            <Phone size={13} style={{ display: 'inline', marginRight: 4 }} />
            Nomor Telepon / WhatsApp
          </label>
          <input
            type="tel"
            className="form-input"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="Contoh: 08123456789"
          />
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">
            <MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />
            Alamat Pengiriman / Penjemputan
          </label>
          <textarea
            className="form-input"
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Alamat lengkap (opsional, digunakan saat pemesanan servis)"
            rows={3}
            style={{ resize: 'vertical' }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Alamat ini akan otomatis diisi pada form Service Request
          </span>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          {saving ? (
            <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> <span>Menyimpan...</span></>
          ) : (
            <><Save size={16} /> <span>Simpan Perubahan Profil</span></>
          )}
        </button>
      </div>

      {/* Change Password */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <Shield size={18} color="var(--accent-indigo)" />
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Keamanan Akun — Ganti Password</h3>
        </div>

        {pwSuccess && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              color: '#34d399',
            }}
          >
            <CheckCircle2 size={17} />
            <span>Password berhasil diperbarui! Gunakan password baru untuk login berikutnya.</span>
          </div>
        )}

        {pwError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              color: '#f87171',
            }}
          >
            <AlertCircle size={17} />
            <span>{pwError}</span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Password Saat Ini *</label>
          <input
            type="password"
            className="form-input"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
            placeholder="Masukkan password lama Anda"
          />
        </div>

        <div className="grid-2" style={{ gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Password Baru *</label>
            <input
              type="password"
              className="form-input"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
              placeholder="Min. 8 karakter"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Konfirmasi Password Baru *</label>
            <input
              type="password"
              className="form-input"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="Ulangi password baru"
            />
          </div>
        </div>

        <button
          onClick={handleChangePassword}
          disabled={pwSaving}
          className="btn btn-secondary"
          style={{ width: '100%', border: '1px solid rgba(99, 102, 241, 0.4)', color: 'var(--accent-indigo)' }}
        >
          {pwSaving ? (
            <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> <span>Memperbarui...</span></>
          ) : (
            <><Key size={16} /> <span>Perbarui Password</span></>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
